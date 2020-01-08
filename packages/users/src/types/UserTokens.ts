export interface AccessToken {
  accessToken: string
  accessTokenExpiration?: string | number
}

export interface UserTokens extends AccessToken {
  refreshToken?: string
}
