import { NextFunction, Request, Response } from 'express'
import {
  BadRequestError,
  Commun,
  EntityController,
  getModelAttribute,
  NotFoundError,
  SecurityUtils,
  ServerError,
  UnauthorizedError
} from '@commun/core'
import { AuthProvider, BaseUserModel, UserModule } from '..'
import { AccessToken, UserTokens } from '../types/UserTokens'
import { AccessTokenSecurity } from '../security/AccessTokenSecurity'
import { EmailClient } from '@commun/emails'
import passport from 'passport'
import { ExternalAuth } from '../security/ExternalAuth'

export class BaseUserController<MODEL extends BaseUserModel> extends EntityController<MODEL> {
  async create (req: Request): Promise<{ item: MODEL }> {
    if (!req.body.password) {
      throw new BadRequestError('Password cannot be blank')
    }

    const { item } = await super.create(req)
    const plainVerificationCode = await SecurityUtils.generateRandomString(48)
    const verificationCode = await SecurityUtils.hashWithBcrypt(plainVerificationCode, 12)
    const user = await this.dao.updateOne(item.id!, { verificationCode, verified: false })

    EmailClient.sendEmail('emailVerification', user.email, {
      verificationCode: plainVerificationCode,
      ...item
    })

    return { item }
  }

  async loginWithPassword (req: Request): Promise<{ user: MODEL, tokens: UserTokens }> {
    const user = await this.findUserByEmailOrUsername(req.body.username || '')

    if (!user || !user.password || !await SecurityUtils.bcryptHashIsValid(req.body.password, user.password)) {
      throw new UnauthorizedError('Invalid username or password')
    }

    return {
      user: await this.prepareModelResponse(req, user),
      tokens: {
        ...(await this.generateAccessToken(user)),
        refreshToken: await this.generateRefreshToken(user),
      },
    }
  }

  async logout (req: Request): Promise<{ result: boolean }> {
    if (!req.auth?.id) {
      return { result: false }
    }
    await this.dao.updateOne(req.auth.id, { refreshTokenHash: undefined })
    return { result: true }
  }

  async getAccessToken (req: Request): Promise<AccessToken> {
    const user = await this.dao.findOne({ username: req.body.username })
    if (!user) {
      throw new NotFoundError()
    }
    if (!user.refreshTokenHash || !await SecurityUtils.bcryptHashIsValid(req.body.refreshToken, user.refreshTokenHash)) {
      throw new UnauthorizedError('Refresh token is invalid or expired')
    }
    return this.generateAccessToken(user)
  }

  async verify (req: Request) {
    const user = await this.dao.findOne({ username: req.body.username })
    if (!user) {
      throw new NotFoundError()
    }
    if (user.verified) {
      return { result: true }
    }
    if (!user.verificationCode) {
      throw new BadRequestError('Missing verification code')
    }
    if (await SecurityUtils.bcryptHashIsValid(req.body.code, user.verificationCode)) {
      await this.dao.updateOne(user.id!, { verified: true, verificationCode: undefined })

      const userData = await this.prepareModelResponse(req, user, {})
      EmailClient.sendEmail('welcomeEmail', user.email, userData)

      return { result: true }
    } else {
      throw new BadRequestError('Invalid verification code')
    }
  }

  async forgotPassword (req: Request) {
    if (!req.body.username) {
      throw new BadRequestError('Missing email or username')
    }
    const user = await this.findUserByEmailOrUsername(req.body.username)
    if (!user) {
      throw new NotFoundError()
    }

    const resetPasswordAttr = Commun.getEntityConfig<MODEL>(UserModule.entityName).attributes.resetPasswordCodeHash
    const plainResetPasswordCode = await SecurityUtils.generateRandomString(48)
    const resetPasswordCodeHash = await getModelAttribute(resetPasswordAttr!, 'resetPasswordCodeHash', {
      resetPasswordCodeHash: plainResetPasswordCode
    })
    await this.dao.updateOne(user.id!, { resetPasswordCodeHash })

    const userData = await this.prepareModelResponse(req, user, {})
    EmailClient.sendEmail('resetPassword', user.email, {
      resetPasswordCode: plainResetPasswordCode,
      ...userData,
    })

    return { result: true }
  }

  async resetPassword (req: Request) {
    if (!req.body.username) {
      throw new BadRequestError('Missing email or username')
    }
    const user = await this.findUserByEmailOrUsername(req.body.username)
    if (!user) {
      throw new NotFoundError()
    }

    if (user.resetPasswordCodeHash && await SecurityUtils.bcryptHashIsValid(req.body.code, user.resetPasswordCodeHash)) {
      const passwordAttr = Commun.getEntityConfig<MODEL>(UserModule.entityName).attributes.password
      const password = await getModelAttribute<MODEL>(passwordAttr!, 'password', { password: req.body.password })
      await this.dao.updateOne(user.id!, { password, resetPasswordCodeHash: undefined })
      return { result: true }
    }
    throw new UnauthorizedError()
  }

  startAuthWithProvider (req: Request, res: Response, next: NextFunction) {
    const provider = req.params.provider as AuthProvider
    passport.authenticate(provider, ExternalAuth.getProviderStrategy(provider).authOptions)(req, res, next)
  }

  authenticateWithProvider (req: Request, res: Response, next: NextFunction) {
    passport.authenticate(req.params.provider, {})(req, res, next)
  }

  async completeAuthWithProvider (req: Request, res: Response) {
    const callbackUrl = UserModule.getOptions().externalAuth?.callbackUrl
    if (!callbackUrl) {
      console.error('External authentication callback url is not set')
      throw new ServerError()
    }
    const userReq = req.user as { user: MODEL, userCreated: boolean, newUser: boolean }
    const provider = req.params.provider as AuthProvider
    const code = await ExternalAuth.sign({
      user: userReq.user,
      provider: {
        key: provider,
        id: userReq.user.providers?.[provider]?.id!,
      },
      userCreated: userReq.userCreated,
    })
    res.redirect(`${callbackUrl}?provider=${provider}&newUser=${userReq.newUser}&code=${code}`)
  }

  async generateAccessTokenForAuthWithProvider (req: Request) {
    const provider = req.params.provider as AuthProvider
    const token = req.body.code
    const payload = await ExternalAuth.verify(token)
    let user

    if (payload.userCreated) {
      user = await this.dao.findOne({ email: payload.user.email })
      if (!user) {
        throw new NotFoundError('User not found')
      }
      const validProvider = payload.provider?.key === provider && payload.provider?.id && payload.provider?.id &&
        payload.provider?.id === user.providers?.[provider]?.id
      if (!validProvider) {
        throw new BadRequestError('Invalid authentication code')
      }
    } else {
      let userData
      if (!payload.user.username) {
        if (!req.body.username) {
          throw new BadRequestError('Username is required')
        }
        userData = {
          ...payload.user,
          username: req.body.username,
        }
      } else {
        userData = payload.user
      }
      user = await this.dao.insertOne(userData as MODEL)

      userData = await this.prepareModelResponse(req, user, {})
      EmailClient.sendEmail('welcomeEmail', user.email, userData)
    }

    return {
      user: await this.prepareModelResponse(req, user),
      tokens: {
        ...(await this.generateAccessToken(user)),
        refreshToken: await this.generateRefreshToken(user),
      },
    }
  }

  private findUserByEmailOrUsername (emailOrUsername: string) {
    return emailOrUsername.includes('@') ?
      this.dao.findOne({ email: emailOrUsername }) :
      this.dao.findOne({ username: emailOrUsername })
  }

  protected async generateAccessToken (user: MODEL) {
    const accessToken = await AccessTokenSecurity.sign({ id: user.id! })
    return {
      accessToken,
      accessTokenExpiration: UserModule.getOptions().accessToken?.expiresIn
    }
  }

  protected async generateRefreshToken (user: MODEL): Promise<string | undefined> {
    if (UserModule.getOptions().refreshToken.enabled) {
      const refreshTokenAttr = Commun.getEntityConfig<MODEL>(UserModule.entityName).attributes.refreshTokenHash
      const plainRefreshToken = await SecurityUtils.generateRandomString(48)
      const refreshTokenHash = await getModelAttribute(refreshTokenAttr!, 'refreshTokenHash', {
        refreshTokenHash: plainRefreshToken
      })
      await this.dao.updateOne(user.id!, { refreshTokenHash })
      return plainRefreshToken
    }
  }
}
