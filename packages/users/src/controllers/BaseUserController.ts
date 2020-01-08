import { Request, Response } from 'express'
import { EntityController, SecurityUtils } from '@commun/core'
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
}
