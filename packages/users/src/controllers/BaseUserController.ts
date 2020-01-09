import { Request, Response } from 'express'
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

export class BaseUserController<MODEL extends BaseUserModel> extends EntityController<MODEL> {
  async create (req: Request, res: Response): Promise<{ item: MODEL }> {
    const { item } = await super.create(req, res)
    const plainVerificationCode = await SecurityUtils.generateRandomString(48)
    const verificationCode = await SecurityUtils.hashWithBcrypt(plainVerificationCode, 12)
    await this.dao.updateOne(item._id!, { verificationCode, verified: false })

    // TODO send verification email

    return { item }
  }

  async loginWithPassword (req: Request, res: Response): Promise<{ user: MODEL, tokens: UserTokens }> {
    const user = await this.findUserByEmailOrUsername(req.body.username)

    if (!user || !await SecurityUtils.bcryptHashIsValid(req.body.password, user.password)) {
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

      // TODO send welcome email

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
    const resetPasswordCodeHash = await getModelAttribute(resetPasswordAttr!, 'resetPasswordCodeHash', plainResetPasswordCode)
    await this.dao.updateOne(user._id!, { resetPasswordCodeHash })

    // TODO send email with plainResetPasswordCode

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
      const password = await getModelAttribute<MODEL>(passwordAttr!, 'password', req.body.password)
      await this.dao.updateOne(user._id!, { password, resetPasswordCodeHash: undefined })
      return { result: true }
    }
    throw new UnauthorizedError()
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
      accessTokenExpiration: UserModule.getOptions().accessToken.signOptions?.expiresIn
    }
  }

  protected async generateRefreshToken (user: MODEL): Promise<string | undefined> {
    if (UserModule.getOptions().refreshToken.enabled) {
      const refreshTokenAttr = Commun.getEntityConfig<MODEL>(UserModule.entityName).attributes.refreshTokenHash
      const plainRefreshToken = await SecurityUtils.generateRandomString(48)
      const refreshTokenHash = await getModelAttribute(refreshTokenAttr!, 'refreshTokenHash', plainRefreshToken)
      await this.dao.updateOne(user._id!, { refreshTokenHash })
      return plainRefreshToken
    }
  }
}
