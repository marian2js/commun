import passport from 'passport'
import { ExternalAuth } from '../../src/security/ExternalAuth'
import { closeTestApp, getTestApp, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun, ConfigManager } from '@commun/core'
import { Express } from 'express'
import { AuthProvider, BaseUserModel, DefaultUserConfig, ExternalAuthPayload, UserModule } from '../../src'
import { GoogleAuthStrategy } from '../../src/security/GoogleAuthStrategy'
import jwt, {
  GetPublicKeyOrSecret,
  JsonWebTokenError,
  Secret,
  SignCallback,
  SignOptions,
  VerifyCallback
} from 'jsonwebtoken'
import { AccessTokenKeys } from '../../src/types/UserTokens'
import { FacebookAuthStrategy } from '../../src/security/FacebookAuthStrategy'

describe('ExternalAuth', () => {
  let app: Express
  const privateKey = 'private'
  const privateKeyPassphrase = 'secret'
  const publicKey = 'public'
  const collectionName = 'external_auth_test'

  beforeEach(async () => {
    UserModule.accessTokenKeys = {
      publicKey: publicKey,
      privateKey: {
        key: privateKey,
        passphrase: privateKeyPassphrase
      }
    }
    ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({
      ...DefaultUserConfig,
      collectionName,
    })) as jest.Mock
    ConfigManager.getKeys = jest.fn(() => Promise.resolve({
      publicKey: publicKey,
      privateKey: privateKey,
    }))
    await UserModule.setup({
      accessToken: {},
      refreshToken: {
        enabled: true
      },
    })
    await startTestApp(Commun)
    app = getTestApp()
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  const getDao = () => Commun.getEntityDao<BaseUserModel>('users')

  describe('setupPassport', () => {
    beforeEach(() => {
      spyOn(passport, 'serializeUser')
      spyOn(passport, 'deserializeUser')
      spyOn(GoogleAuthStrategy, 'registerStrategy')
    })

    const setStrategy = (provider: AuthProvider, enabled: boolean) => {
      const options = UserModule.getOptions()
      UserModule.setOptions({
        ...options,
        externalAuth: {
          ...options.externalAuth!,
          providers: {
            [provider]: {
              enabled
            }
          }
        }
      })
    }

    it('should setup user serialization and deserialization', async () => {
      ExternalAuth.setupPassport(app)
      expect(passport.serializeUser).toHaveBeenCalled()
      expect(passport.deserializeUser).toHaveBeenCalled()
    })

    it('should register google strategy if enabled', async () => {
      setStrategy('google', true)
      ExternalAuth.setupPassport(app)
      expect(GoogleAuthStrategy.registerStrategy).toHaveBeenCalled()
    })

    it('should not register google strategy if not enabled', async () => {
      setStrategy('google', false)
      ExternalAuth.setupPassport(app)
      expect(GoogleAuthStrategy.registerStrategy).not.toHaveBeenCalled()
    })
  })

  describe('getProviderStrategy', () => {
    it('should return the strategy for a given provider', async () => {
      expect(ExternalAuth.getProviderStrategy('google')).toBe(GoogleAuthStrategy)
      expect(ExternalAuth.getProviderStrategy('facebook')).toBe(FacebookAuthStrategy)
    })
  })

  describe('authCallback', () => {
    it('should create an account with an auto-generated username', async () => {
      const options = UserModule.getOptions()
      UserModule.setOptions({
        ...options,
        externalAuth: {
          ...options.externalAuth!,
          autoGenerateUsername: true,
        }
      })
      const fakeProfile = {
        id: 'google-id',
        displayName: 'Test User',
        emails: [{ value: 'test@example.org', verified: true }]
      }
      await ExternalAuth.authCallback('google', 'access', 'refresh', fakeProfile as any, () => {})
      const user = await getDao().findOne({ email: 'test@example.org' })
      expect(user!.username).toBe('testuser')
      expect(user!.verified).toBe(true)
      expect(user!.providers!.google).toEqual({
        id: 'google-id'
      })
    })

    it('should not create an account if auto-generate username is not enabled', async () => {
      const fakeProfile = {
        id: 'google-id',
        displayName: 'Test User',
        emails: [{ value: 'test@example.org', verified: true }]
      }
      await ExternalAuth.authCallback('google', 'access', 'refresh', fakeProfile as any, () => {})
      const user = await getDao().findOne({ email: 'test@example.org' })
      expect(user).toBe(null)
    })

    it('should update an account from a provider with verified email', async () => {
      await getDao().insertOne({
        username: 'test-user',
        email: 'test@example.org',
        verified: true,
      })
      const fakeProfile = {
        id: 'google-id',
        emails: [{ value: 'test@example.org', verified: true }]
      }
      await ExternalAuth.authCallback('google', 'access', 'refresh', fakeProfile as any, () => {})
      const user = await getDao().findOne({ email: 'test@example.org' })
      expect(user!.providers!.google).toEqual({
        id: 'google-id'
      })
    })

    it('should not update an account from a provider with verified email', async () => {
      await getDao().insertOne({
        username: 'test-user',
        email: 'test@example.org',
        verified: true,
      })
      const fakeProfile = {
        id: 'google-id',
        emails: [{ value: 'test@example.org', verified: false }]
      }
      await ExternalAuth.authCallback('google', 'access', 'refresh', fakeProfile as any, () => {})
      const user = await getDao().findOne({ email: 'test@example.org' })
      expect(user!.providers).toBeUndefined()
    })
  })

  describe('sign', () => {
    let fakePayload: ExternalAuthPayload = {
      user: {
        email: 'test@example.org',
        username: 'test',
        verified: true
      },
      provider: {
        key: 'google',
        id: 'id'
      },
      userCreated: true
    }

    it('should return a jwt signed token', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: ExternalAuthPayload,
        secretOrPrivateKey: AccessTokenKeys['privateKey'],
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(null!, `SIGN(${payload.user.email}:${payload.provider.key}:${payload.provider.id})`)
      })

      const signed = await ExternalAuth.sign(fakePayload)
      expect(signed).toBe(`SIGN(test@example.org:google:id)`)
    })

    it('should return an error if the sign fails', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: { id: string },
        secretOrPrivateKey: Secret,
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(new Error('Sign failed'), '')
      })

      await expect(ExternalAuth.sign(fakePayload))
        .rejects.toThrow('Sign failed')
    })
  })

  describe('verify', () => {
    it('should return the information from a valid token using a private secret', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: AccessTokenKeys['publicKey'],
        callback: VerifyCallback
      ) => {
        callback(null!, { id: `VERIFIED(${token}:${secretOrPublicKey})` })
      })

      expect(await ExternalAuth.verify('token')).toEqual({ id: `VERIFIED(token:${publicKey})` })
    })

    it('should return the information from a valid token using a public key', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: AccessTokenKeys['publicKey'],
        callback: VerifyCallback
      ) => {
        callback(null!, { id: `VERIFIED(${token}:${secretOrPublicKey})` })
      })

      expect(await ExternalAuth.verify('token')).toEqual({ id: `VERIFIED(token:${publicKey})` })
    })

    it('should throw an error if the token cannot be verified', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: Secret | GetPublicKeyOrSecret,
        callback: VerifyCallback
      ) => {
        callback(new JsonWebTokenError('BAD TOKEN'), undefined)
      })

      await expect(ExternalAuth.verify('token')).rejects.toThrow('BAD TOKEN')
    })
  })
})
