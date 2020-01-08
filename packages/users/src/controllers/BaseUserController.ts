import { Request, Response } from 'express'
import { BadRequestError, EntityController, NotFoundError, SecurityUtils } from '@commun/core'
import { BaseUserModel } from '..'

export class BaseUserController<MODEL extends BaseUserModel> extends EntityController<MODEL> {
  async create (req: Request, res: Response): Promise<{ item: MODEL }> {
    const { item } = await super.create(req, res)
    const plainVerificationCode = await SecurityUtils.generateRandomString(48)
    const verificationCode = await SecurityUtils.hashWithBcrypt(plainVerificationCode, 12)
    await this.dao.updateOne(item._id!, { verificationCode, verified: false })

    // TODO send verification email

    return { item }
  }

  async verify (req: Request, res: Response) {
    const user = await this.dao.findOne({ username: req.params.username })
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
}
