import { BaseUserModel } from './BaseUserModel'

export type AuthProvider =
  'google'

export type ExternalAuthPayload = {
  user: BaseUserModel
  provider: {
    key: AuthProvider
    id: string
  }
  userCreated: boolean
}
