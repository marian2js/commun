import passport from 'passport'
import { Commun } from '@commun/core'
import { Strategy } from 'passport-facebook'
import { FacebookAuthStrategy } from '../../src/security/FacebookAuthStrategy'

describe('FacebookAuthStrategy', () => {
  beforeEach(() => {
    Commun.setOptions({ endpoint: 'http://example.org:1234', mongoDB: { uri: '', dbName: '' } })
    process.env.FACEBOOK_APP_ID = 'FACEBOOK_APP_ID'
    process.env.FACEBOOK_APP_SECRET = 'FACEBOOK_APP_SECRET'
  })

  describe('registerStrategy', () => {
    it('should set a google strategy on passport', async () => {
      spyOn(passport, 'use')
      FacebookAuthStrategy.registerStrategy()
      expect(passport.use).toHaveBeenCalledWith(new Strategy({
        clientID: 'FACEBOOK_APP_ID',
        clientSecret: 'FACEBOOK_APP_SECRET',
        callbackURL: 'http://example.org:1234/api/v1/auth/facebook/callback',
        profileFields: ['id', 'emails', 'displayName'],
      }, expect.any(Function)))
    })
  })
})
