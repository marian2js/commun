import passport from 'passport'
import { Strategy } from 'passport-google-oauth20'
import { Commun } from '@commun/core'
import { ExternalAuth } from './ExternalAuth'

export const GoogleAuthStrategy = {
  registerStrategy () {
    passport.use(new Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${Commun.getOptions().endpoint}/api/v1/auth/google/callback`
      }, async (...args) => {
        await ExternalAuth.authCallback('google', ...args)
      })
    )
  },
}
