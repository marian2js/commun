import { BaseUserModel, UserModule } from '..'
import { assertNever, BadRequestError, Commun } from '@commun/core'
import { AuthProvider, ExternalAuthPayload } from '../types/ExternalAuth'
import jwt from 'jsonwebtoken'
import passport, { Profile } from 'passport'
import { GoogleAuthStrategy } from './GoogleAuthStrategy'
import { Express } from 'express'
import { UserUtils } from '../utils/UserUtils'
import { FacebookAuthStrategy } from './FacebookAuthStrategy'
import { GithubAuthStrategy } from './GithubAuthStrategy'

type ProviderCallback = (err?: any, user?: any, info?: any) => void

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
      if (provider?.enabled) {
        this.getProviderStrategy(providerKey).registerStrategy()
      }
    }
  },

  getProviderStrategy (provider: AuthProvider) {
    switch (provider) {
      case 'google':
        return GoogleAuthStrategy
      case 'facebook':
        return FacebookAuthStrategy
      case 'github':
        return GithubAuthStrategy
      default:
        assertNever(provider)
        throw new Error('Unexpected provider')
    }
  },

  async authCallback (provider: AuthProvider, accessToken: string, refreshToken: string, profile: Profile, cb: ProviderCallback) {
    if (!profile.emails?.length) {
      return cb(new BadRequestError('An email address must be provided in order to do the authentication'))
    }

    const emailInfo = {
      ...(profile.emails[0] as { value: string, verified?: boolean })
    }

    const user = await Commun.getEntityDao<BaseUserModel>('users')
      .findOne({ email: emailInfo.value })

    if (user) {
      await this.updateAccountFromProvider(provider, profile, user, emailInfo.verified, cb)
    } else {
      await this.createAccountFromProvider(provider, profile, emailInfo.value, emailInfo.verified, cb)
    }
  },

  async createAccountFromProvider (
    provider: AuthProvider,
    profile: Profile,
    email: string,
    emailVerified: boolean | undefined,
    cb: ProviderCallback
  ) {
    let user = {
      email: email,
      verified: emailVerified !== false,
      providers: {
        [provider]: {
          id: profile.id
        }
      }
    }

    if (UserModule.getOptions().externalAuth?.autoGenerateUsername) {
      let usernamePrefix
      if (profile.displayName) {
        usernamePrefix = profile.displayName.replace(/\s/g, '').toLowerCase()
      } else if (profile.username) {
        usernamePrefix = profile.username
      } else {
        usernamePrefix = email.split('@')[0].toLowerCase()
      }
      const username = await UserUtils.generateUniqueUsername(usernamePrefix)
      const createdUser = await Commun.getEntityDao<BaseUserModel>('users').insertOne({
        ...user,
        username,
      })
      cb(undefined, {
        user: createdUser,
        userCreated: true,
        newUser: true,
      })
    } else {
      cb(undefined, {
        user,
        userCreated: false,
        newUser: true,
      })
    }
  },

  async updateAccountFromProvider (provider: AuthProvider,
    profile: Profile,
    user: BaseUserModel,
    emailVerified: boolean | undefined,
    cb: ProviderCallback
  ) {
    if (emailVerified === false) {
      return cb(new Error('Cannot authenticate with an unverified email'))
    }
    const providers = {
      ...(user.providers || {}),
      [provider]: {
        id: profile.id
      }
    }
    const updatedUser = await Commun.getEntityDao<BaseUserModel>('users').updateOne(user._id!, { providers })
    cb(undefined, {
      user: updatedUser,
      userCreated: true,
      newUser: false,
    })
  },

  sign: (payload: ExternalAuthPayload): Promise<string> => {
    const signOptions = {
      ...(UserModule.getOptions().accessToken || {}),
      expiresIn: '30 minutes',
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
