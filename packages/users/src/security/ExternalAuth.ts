import { VerifyCallback } from 'passport-google-oauth20'
import { BaseUserModel, UserModule } from '..'
import { assertNever, BadRequestError, Commun } from '@commun/core'
import { AuthProvider, ExternalAuthPayload } from '../types/ExternalAuth'
import jwt from 'jsonwebtoken'
import passport, { Profile } from 'passport'
import { GoogleAuthStrategy } from './GoogleAuthStrategy'
import { Express } from 'express'

export const ExternalAuth = {
  setupPassport (app: Express) {
    passport.serializeUser(function (user, cb) {
      cb(null, user)
    })

    passport.deserializeUser(function (obj, cb) {
      cb(null, obj)
    })
    this._registerStrategies()
    app.use(passport.initialize())
  },

  _registerStrategies () {
    const providers = UserModule.getOptions().externalAuth?.providers
    if (!providers) {
      return
    }
    for (const [key, provider] of Object.entries(providers)) {
      const providerKey = key as AuthProvider
      if (provider.enabled) {
        switch (providerKey) {
          case 'google':
            GoogleAuthStrategy.registerStrategy()
            break
          default:
            assertNever(providerKey)
        }
      }
    }
  },

  async authCallback (provider: AuthProvider, accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) {
    if (!profile.emails?.length) {
      return cb(new BadRequestError('An email address must be provided in order to do the authentication'))
    }

    const emailInfo = {
      ...(profile.emails[0] as { value: string, verified: boolean })
    }

    const user = await Commun.getEntityDao<BaseUserModel>('users')
      .findOne({ email: emailInfo.value })

    if (user) {
      await this.updateAccountFromProvider(provider, profile, user, emailInfo.verified, cb)
    } else {
      await this.createAccountFromProvider(provider, profile, emailInfo.value, emailInfo.verified, cb)
    }
  },

  async createAccountFromProvider (provider: AuthProvider, profile: Profile, email: string, emailVerified: boolean, cb: VerifyCallback) {
    throw new Error('not implemented yet') // TODO
  },

  async updateAccountFromProvider (provider: AuthProvider, profile: Profile, user: BaseUserModel, emailVerified: boolean, cb: VerifyCallback) {
    if (!emailVerified) {
      return cb(new Error('Cannot authenticate with an unverified email'))
    }
    const providers = {
      ...(user.providers || {}),
      [provider]: {
        id: profile.id
      }
    }
    const updatedUser = await Commun.getEntityDao<BaseUserModel>('users').updateOne(user._id!, { providers })
    cb(undefined, updatedUser)
  },

  sign: (payload: ExternalAuthPayload): Promise<string> => {
    const signOptions = {
      ...(UserModule.getOptions().accessToken || {}),
      expiresIn: '5 minutes',
    }
    return new Promise(((resolve, reject) => {
      jwt.sign(payload, UserModule.accessTokenKeys.privateKey, signOptions, (err, token) => {
        if (err) {
          return reject(err)
        }
        resolve(token)
      })
    }))
  },

  verify: (token: string): Promise<ExternalAuthPayload> => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, UserModule.accessTokenKeys.publicKey, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data as ExternalAuthPayload)
      })
    })
  },
}
