export interface AccessToken {
  accessToken: string
  accessTokenExpiration?: string | number
}

export interface UserTokens extends AccessToken {
  refreshToken?: string
}

export interface AccessTokenKeys {
  publicKey: string
  privateKey: {
    key: string
    passphrase: string
  }
}
