import { UserModel } from './UserModel'

export type AuthProvider =
  'google' |
  'facebook' |
  'github'

export type ExternalAuthPayload = {
  user: UserModel
  provider: {
    key: AuthProvider
    id: string
  }
  userCreated: boolean
}
