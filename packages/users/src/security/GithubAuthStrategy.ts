import passport from 'passport'
import { Strategy } from 'passport-github2'
import { Commun } from '@commun/core'
import { ExternalAuth } from './ExternalAuth'
import { VerifyCallback } from 'passport-oauth2'

export const GithubAuthStrategy = {
  registerStrategy () {
    passport.use(new Strategy({
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${Commun.getOptions().endpoint}/api/v1/auth/github/callback`,
        scope: ['user:email'],
      }, async (accessToken: string, refreshToken: string, profile: any, verified: VerifyCallback) => {
        await ExternalAuth.authCallback('github', accessToken, refreshToken, profile, verified)
      })
    )
  },

  authOptions: {
    scope: ['user:email']
  },
}
