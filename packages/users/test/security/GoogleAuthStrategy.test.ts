import passport from 'passport'
import { GoogleAuthStrategy } from '../../src/security/GoogleAuthStrategy'
import { Commun } from '@commun/core'
import { Strategy } from 'passport-google-oauth20'

describe('GoogleAuthStrategy', () => {
  beforeEach(() => {
    Commun.setOptions({ endpoint: 'http://example.org:1234', mongoDB: { uri: '', dbName: '' } })
    process.env.GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID'
    process.env.GOOGLE_CLIENT_SECRET = 'GOOGLE_CLIENT_SECRET'
  })

  describe('registerStrategy', () => {
    it('should set a google strategy on passport', async () => {
      spyOn(passport, 'use')
      GoogleAuthStrategy.registerStrategy()
      expect(passport.use).toHaveBeenCalledWith(new Strategy({
        clientID: 'GOOGLE_CLIENT_ID',
        clientSecret: 'GOOGLE_CLIENT_SECRET',
        callbackURL: 'http://example.org:1234/api/v1/auth/google/callback'
      }, expect.any(Function)))
    })
  })
})
