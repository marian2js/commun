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
import jwt from 'jsonwebtoken'
import { UserTokens } from '../types/UserTokens'

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
    const user = req.body.username.includes('@') ?
      await this.dao.findOne({ email: req.body.username }) :
      await this.dao.findOne({ username: req.body.username })

    if (!user || !await SecurityUtils.bcryptHashIsValid(req.body.password, user.password)) {
      throw new UnauthorizedError('Invalid username or password')
    }

    return {
      user: await this.prepareModelResponse(user),
      tokens: {
        ...this.generateAccessToken(user),
        refreshToken: await this.generateRefreshToken(user),
      },
    }
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

  protected generateAccessToken (user: MODEL) {
    const options = UserModule.getOptions()
    const accessToken = jwt.sign({ _id: user._id }, options.accessToken.secretOrPrivateKey, options.accessToken.signOptions)
    return {
      accessToken,
      accessTokenExpiration: options.accessToken.signOptions?.expiresIn
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
