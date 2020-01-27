import { NextFunction, Request, Response } from 'express'
import {
  BadRequestError,
  Commun,
  EntityController,
  getModelAttribute,
  NotFoundError,
  SecurityUtils,
  UnauthorizedError
} from '@commun/core'
import { BaseUserModel, UserModule } from '..'
import { AccessToken, UserTokens } from '../types/UserTokens'
import { AccessTokenSecurity } from '../security/AccessTokenSecurity'
import { EmailClient } from '@commun/emails'
import passport from 'passport'
import { ExternalAuth } from '../security/ExternalAuth'
import { AuthProvider } from '../types/ExternalAuth'

export class BaseUserController<MODEL extends BaseUserModel> extends EntityController<MODEL> {
  async create (req: Request, res: Response): Promise<{ item: MODEL }> {
    if (!req.body.password) {
      throw new BadRequestError('Password cannot be blank')
    }

    const { item } = await super.create(req, res)
    const plainVerificationCode = await SecurityUtils.generateRandomString(48)
    const verificationCode = await SecurityUtils.hashWithBcrypt(plainVerificationCode, 12)
    const user = await this.dao.updateOne(item._id!, { verificationCode, verified: false })

    EmailClient.sendEmail('emailVerification', user.email, {
      verificationCode: plainVerificationCode,
      ...item
    })

    return { item }
  }

  async loginWithPassword (req: Request, res: Response): Promise<{ user: MODEL, tokens: UserTokens }> {
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

  async getAccessToken (req: Request, res: Response): Promise<AccessToken> {
    const user = await this.dao.findOne({ username: req.body.username })
    if (!user) {
      throw new NotFoundError()
    }
    if (!user.refreshTokenHash || !await SecurityUtils.bcryptHashIsValid(req.body.refreshToken, user.refreshTokenHash)) {
      throw new UnauthorizedError('Refresh token is invalid or expired')
    }
    return this.generateAccessToken(user)
  }

  async verify (req: Request, res: Response) {
    const user = await this.dao.findOne({ username: req.body.username })
    if (!user) {
      throw new NotFoundError()
    }
    if (user.verified) {
      return res.send({ result: true })
    }
    if (!user.verificationCode) {
      throw new BadRequestError('Missing verification code')
    }
    if (await SecurityUtils.bcryptHashIsValid(req.body.code, user.verificationCode)) {
      await this.dao.updateOne(user._id!, { verified: true, verificationCode: undefined })

      const userData = await this.prepareModelResponse(req, user, {})
      EmailClient.sendEmail('welcomeEmail', user.email, userData)

      res.send({ result: true })
    } else {
      throw new BadRequestError('Invalid verification code')
    }
  }

  async forgotPassword (req: Request, res: Response) {
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
    await this.dao.updateOne(user._id!, { resetPasswordCodeHash })

    const userData = await this.prepareModelResponse(req, user, {})
    EmailClient.sendEmail('resetPassword', user.email, {
      resetPasswordCode: plainResetPasswordCode,
      ...userData,
    })

    return { result: true }
  }

  async resetPassword (req: Request, res: Response) {
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
      await this.dao.updateOne(user._id!, { password, resetPasswordCodeHash: undefined })
      return { result: true }
    }
    throw new UnauthorizedError()
  }

  startAuthWithProvider (req: Request, res: Response, next: NextFunction) {
    passport.authenticate(req.params.provider, { scope: ['profile', 'email'] })(req, res, next)
  }

  authenticateWithProvider (req: Request, res: Response, next: NextFunction) {
    passport.authenticate(req.params.provider, {})(req, res, next)
  }

  async completeAuthWithProvider (req: Request, res: Response) {
    const callbackUrl = UserModule.getOptions().externalAuth?.callbackUrl
    if (!callbackUrl) {
      return res.send({})
    }
    const user = req.user as BaseUserModel
    const provider = req.params.provider as AuthProvider
    const code = await ExternalAuth.sign({
      email: user.email,
      provider,
      providerId: user.providers?.[provider]?.id!,
    })
    res.redirect(`${callbackUrl}?code=${code}`)
  }

  async getAccessTokenForAuthWithProvider (req: Request, res: Response) {
    const provider = req.params.provider as AuthProvider
    const token = req.query.code
    const payload = await ExternalAuth.verify(token)
    const user = await this.dao.findOne({ email: payload.email })
    if (!user) {
      throw new NotFoundError('User not found')
    }
    const validProvider = payload.provider && payload.providerId && payload.provider === provider &&
      user.providers?.[provider]?.id === payload.providerId
    if (validProvider) {
      return this.generateAccessToken(user)
    }
    throw new BadRequestError('Invalid authentication code')
  }

  private findUserByEmailOrUsername (emailOrUsername: string) {
    return emailOrUsername.includes('@') ?
      this.dao.findOne({ email: emailOrUsername }) :
      this.dao.findOne({ username: emailOrUsername })
  }

  protected async generateAccessToken (user: MODEL) {
    const accessToken = await AccessTokenSecurity.sign({ _id: user._id! })
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
      await this.dao.updateOne(user._id!, { refreshTokenHash })
      return plainRefreshToken
    }
  }
}
