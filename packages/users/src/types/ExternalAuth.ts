import { BaseUserModel } from './BaseUserModel'

export type AuthProvider =
  'google' |
  'facebook'

export type ExternalAuthPayload = {
  user: BaseUserModel
  provider: {
    key: AuthProvider
    id: string
  }
  userCreated: boolean
}
