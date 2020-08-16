import { EntityModel } from '@commun/core'
import { AuthProvider } from './ExternalAuth'

export interface UserModel extends EntityModel {
  username: string
  email: string
  password?: string
  verified: boolean
  refreshTokenHash?: string
  verificationCode?: string
  resetPasswordCodeHash?: string
  admin?: boolean
  providers?: {
    [key in AuthProvider]?: {
      id: string
    }
  }
}
