import passport from 'passport'
import { ExternalAuth } from '../../src/security/ExternalAuth'
import { closeTestApp, getTestApp, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun, ConfigManager } from '@commun/core'
import { Express } from 'express'
import { BaseUserModel, DefaultUserConfig, UserModule } from '../../src'
import { GoogleAuthStrategy } from '../../src/security/GoogleAuthStrategy'
import { AuthProvider, ExternalAuthPayload } from '../../src/types/ExternalAuth'
import jwt, {
  GetPublicKeyOrSecret,
  JsonWebTokenError,
  Secret,
  SignCallback,
  SignOptions,
  VerifyCallback
} from 'jsonwebtoken'
import { AccessTokenKeys } from '../../src/types/UserTokens'

describe('ExternalAuth', () => {
  let app: Express
  const privateKey = 'private'
  const privateKeyPassphrase = 'secret'
  const publicKey = 'public'

  beforeEach(async () => {
    UserModule.accessTokenKeys = {
      publicKey: publicKey,
      privateKey: {
        key: privateKey,
        passphrase: privateKeyPassphrase
      }
    }
    ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve(DefaultUserConfig)) as jest.Mock
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
  afterEach(async () => await stopTestApp('users'))
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

  describe('authCallback', () => {
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
    it('should return a jwt signed token', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: ExternalAuthPayload,
        secretOrPrivateKey: AccessTokenKeys['privateKey'],
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(null!, `SIGN(${payload.email}:${payload.provider}:${payload.providerId})`)
      })

      const signed = await ExternalAuth.sign({ email: 'test@example.org', provider: 'google', providerId: 'id' })
      expect(signed).toBe(`SIGN(test@example.org:google:id)`)
    })

    it('should return an error if the sign fails', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: { _id: string },
        secretOrPrivateKey: Secret,
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(new Error('Sign failed'), '')
      })

      await expect(ExternalAuth.sign({ email: 'test@example.org', provider: 'google', providerId: 'id' }))
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
        callback(null!, `VERIFIED(${token}:${secretOrPublicKey})`)
      })

      expect(await ExternalAuth.verify('token')).toBe(`VERIFIED(token:${publicKey})`)
    })

    it('should return the information from a valid token using a public key', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: AccessTokenKeys['publicKey'],
        callback: VerifyCallback
      ) => {
        callback(null!, `VERIFIED(${token}:${secretOrPublicKey})`)
      })

      expect(await ExternalAuth.verify('token')).toBe(`VERIFIED(token:${publicKey})`)
    })

    it('should throw an error if the token cannot be verified', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: Secret | GetPublicKeyOrSecret,
        callback: VerifyCallback
      ) => {
        callback(new JsonWebTokenError('BAD TOKEN'), '')
      })

      await expect(ExternalAuth.verify('token')).rejects.toThrow('BAD TOKEN')
    })
  })
})
