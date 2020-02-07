import { Request, Response } from 'express'
import { UserModule } from '../../src'
import { AccessTokenSecurity } from '../../src/security/AccessTokenSecurity'
import jwt, {
  GetPublicKeyOrSecret,
  JsonWebTokenError,
  Secret,
  SignCallback,
  SignOptions,
  VerifyCallback
} from 'jsonwebtoken'
import { AccessTokenKeys } from '../../src/types/UserTokens'

describe('AccessTokenSecurity', () => {
  const privateKey = 'private'
  const privateKeyPassphrase = 'secret'
  const publicKey = 'public'
  const userId = '123456'

  beforeEach(() => {
    UserModule.accessTokenKeys = {
      publicKey: publicKey,
      privateKey: {
        key: privateKey,
        passphrase: privateKeyPassphrase
      }
    }
    UserModule.setOptions({
      accessToken: {},
      refreshToken: {
        enabled: true
      }
    })
  })

  describe('sign', () => {
    it('should return a jwt signed token', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: { id: string },
        secretOrPrivateKey: AccessTokenKeys['privateKey'],
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(null!, `SIGN(${payload.id}:${secretOrPrivateKey.key}:${secretOrPrivateKey.passphrase})`)
      })

      const signed = await AccessTokenSecurity.sign({ id: userId })
      expect(signed).toBe(`SIGN(${userId}:${privateKey}:${privateKeyPassphrase})`)
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

      await expect(AccessTokenSecurity.sign({ id: userId })).rejects.toThrow('Sign failed')
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

      expect(await AccessTokenSecurity.verify('token')).toBe(`VERIFIED(token:${publicKey})`)
    })

    it('should return the information from a valid token using a public key', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: AccessTokenKeys['publicKey'],
        callback: VerifyCallback
      ) => {
        callback(null!, `VERIFIED(${token}:${secretOrPublicKey})`)
      })

      expect(await AccessTokenSecurity.verify('token')).toBe(`VERIFIED(token:${publicKey})`)
    })

    it('should throw an error if the token cannot be verified', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: Secret | GetPublicKeyOrSecret,
        callback: VerifyCallback
      ) => {
        callback(new JsonWebTokenError('BAD TOKEN'), '')
      })

      await expect(AccessTokenSecurity.verify('token')).rejects.toThrow('BAD TOKEN')
    })
  })

  describe('setRequestAuthMiddleware', () => {
    it('should set auth info in the Request using the token from Headers', async () => {
      AccessTokenSecurity.verify = jest.fn(() => Promise.resolve({ id: userId }))

      const req = {
        headers: {
          authorization: 'Bearer TOKEN'
        }
      } as Request
      const next = jest.fn()
      await AccessTokenSecurity.setRequestAuthMiddleware(req, {} as Response, next)
      expect(AccessTokenSecurity.verify).toHaveBeenCalledWith('TOKEN')
      expect(req.auth?.id).toBe(userId)
      expect(next).toHaveBeenCalled()
    })

    it('should not set auth info if the authorization is missing', async () => {
      AccessTokenSecurity.verify = jest.fn(() => Promise.resolve({ id: userId }))

      const req = {
        headers: {}
      } as Request
      const next = jest.fn()
      await AccessTokenSecurity.setRequestAuthMiddleware(req, {} as Response, next)
      expect(AccessTokenSecurity.verify).not.toHaveBeenCalled()
      expect(req.auth).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should not set auth info if the authorization is invalid', async () => {
      AccessTokenSecurity.verify = jest.fn(() => Promise.reject(new Error()))

      const req = {
        headers: {}
      } as Request
      const next = jest.fn()
      await AccessTokenSecurity.setRequestAuthMiddleware(req, {} as Response, next)
      expect(AccessTokenSecurity.verify).not.toHaveBeenCalled()
      expect(req.auth).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })
  })
})
