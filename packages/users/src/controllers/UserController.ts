import { NextFunction, Request, Response } from 'express'
import {
  BadRequestError,
  EntityController,
  getModelPropertyValue,
  NotFoundError,
  SecurityUtils,
  ServerError,
  UnauthorizedError
} from '@commun/core'
import { AuthProvider, UserModel, UserModule } from '..'
import { AccessToken, UserTokens } from '../types/UserTokens'
import { AccessTokenSecurity } from '../security/AccessTokenSecurity'
import { EmailClient } from '@commun/emails'
import passport from 'passport'
import { ExternalAuth } from '../security/ExternalAuth'
import ms from 'ms'
import { JSONSchema7 } from 'json-schema'

export class UserController<MODEL extends UserModel> extends EntityController<MODEL> {
  async create (req: Request): Promise<{ item: MODEL }> {
    if (!req.body.password) {
      throw new BadRequestError('Password cannot be blank')
    }

    const { item } = await super.create(req)
    const plainVerificationCode = SecurityUtils.generateRandomString(48)
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

    const auth = await this.getAuthPermissions(req)
    return {
      user: await this.prepareModelResponse(req, auth, user),
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

      const auth = await this.getAuthPermissions(req)
      const userData = await this.prepareModelResponse(req, auth, user, {})
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

    const plainResetPasswordCode = SecurityUtils.generateRandomString(48)
    const resetPasswordCodeHash = await getModelPropertyValue({
      entityName: this.entityName,
      property: this.config.schema.properties!.resetPasswordCodeHash as JSONSchema7,
      key: 'resetPasswordCodeHash',
      data: {
        resetPasswordCodeHash: plainResetPasswordCode
      },
    })
    await this.dao.updateOne(user.id!, { resetPasswordCodeHash })

    const auth = await this.getAuthPermissions(req)
    const userData = await this.prepareModelResponse(req, auth, user, {})
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
      const password = await getModelPropertyValue<MODEL>({
        entityName: this.entityName,
        property: this.config.schema.properties!.password as JSONSchema7,
        key: 'password',
        data: { password: req.body.password },
      })
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
    let auth
    let userData

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
      auth = {
        userId: user.id!,
        isAdmin: user.admin || false,
      }
    } else {
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
      auth = {
        userId: user.id!,
        isAdmin: user.admin || false,
      }

      userData = await this.prepareModelResponse(req, auth, user, {})
      EmailClient.sendEmail('welcomeEmail', user.email, userData)
    }

    return {
      user: userData || await this.prepareModelResponse(req, auth, user),
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
    let expiresIn = UserModule.getOptions().accessToken?.expiresIn || 0
    const expirationMilliseconds = typeof expiresIn === 'number' ? expiresIn : ms(expiresIn)
    return {
      accessToken,
      accessTokenExpiration: new Date().getTime() + expirationMilliseconds
    }
  }

  protected async generateRefreshToken (user: MODEL): Promise<string | undefined> {
    if (UserModule.getOptions().refreshToken.enabled) {
      const plainRefreshToken = SecurityUtils.generateRandomString(48)
      const refreshTokenHash = await getModelPropertyValue({
        entityName: this.entityName,
        property: this.config.schema.properties!.refreshTokenHash as JSONSchema7,
        key: 'refreshTokenHash',
        data: {
          refreshTokenHash: plainRefreshToken
        },
      })
      await this.dao.updateOne(user.id!, { refreshTokenHash })
      return plainRefreshToken
    }
  }
}
