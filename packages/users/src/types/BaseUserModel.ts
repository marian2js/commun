import { EntityModel } from '@commun/core'

export interface BaseUserModel extends EntityModel {
  username: string
  email: string
  password: string
  verified: boolean
  refreshTokenHash?: string
  verificationCode?: string
  resetPasswordCode?: string
}
