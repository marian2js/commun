export type AuthProvider =
  'google'

export type ExternalAuthPayload = {
  email: string
  provider: AuthProvider
  providerId: string
}
