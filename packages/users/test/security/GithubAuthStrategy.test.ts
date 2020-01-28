import passport from 'passport'
import { Commun } from '@commun/core'
import { Strategy } from 'passport-github2'
import { GithubAuthStrategy } from '../../src/security/GithubAuthStrategy'

describe('GithubAuthStrategy', () => {
  beforeEach(() => {
    Commun.setOptions({ endpoint: 'http://example.org:1234', mongoDB: { uri: '', dbName: '' } })
    process.env.GITHUB_CLIENT_ID = 'GITHUB_CLIENT_ID'
    process.env.GITHUB_CLIENT_SECRET = 'GITHUB_CLIENT_SECRET'
  })

  describe('registerStrategy', () => {
    it('should set a github strategy on passport', async () => {
      spyOn(passport, 'use')
      GithubAuthStrategy.registerStrategy()
      expect(passport.use).toHaveBeenCalledWith(new Strategy({
        clientID: 'GITHUB_CLIENT_ID',
        clientSecret: 'GITHUB_CLIENT_SECRET',
        callbackURL: 'http://example.org:1234/api/v1/auth/github/callback',
        scope: ['user:email'],
      }, expect.any(Function)))
    })
  })
})
