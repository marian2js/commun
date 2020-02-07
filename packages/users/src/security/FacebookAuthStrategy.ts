import passport from 'passport'
import { Strategy } from 'passport-facebook'
import { Commun } from '@commun/core'
import { ExternalAuth } from './ExternalAuth'

export const FacebookAuthStrategy = {
  registerStrategy () {
    passport.use(new Strategy({
        clientID: process.env.FACEBOOK_APPid!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        callbackURL: `${Commun.getOptions().endpoint}/api/v1/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'displayName'],
      }, async (...args) => {
        await ExternalAuth.authCallback('facebook', ...args)
      })
    )
  },

  authOptions: {
    scope: 'email'
  },
}
