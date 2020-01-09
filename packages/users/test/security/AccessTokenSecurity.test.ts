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

describe('AccessTokenSecurity', () => {
  const secretOrPrivateKey = 'private'
  const secretOrPublicKey = 'public'
  const userId = '123456'

  beforeEach(() => {
    UserModule.setOptions({
      accessToken: {
        secretOrPrivateKey: secretOrPrivateKey
      }
    })
  })

  describe('sign', () => {
    it('should return a jwt signed token', async () => {
      jwt.sign = <jest.Mock>jest.fn((
        payload: { _id: string },
        secretOrPrivateKey: Secret,
        options: SignOptions,
        callback: SignCallback
      ) => {
        callback(null!, `SIGN(${payload._id}:${secretOrPrivateKey})`)
      })

      const signed = await AccessTokenSecurity.sign({ _id: userId })
      expect(signed).toBe(`SIGN(${userId}:${secretOrPrivateKey})`)
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

      await expect(AccessTokenSecurity.sign({ _id: userId })).rejects.toThrow('Sign failed')
    })
  })

  describe('verify', () => {
    it('should return the information from a valid token using a private secret', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: Secret | GetPublicKeyOrSecret,
        callback: VerifyCallback
      ) => {
        callback(null!, `VERIFIED(${token}:${secretOrPublicKey})`)
      })

      expect(await AccessTokenSecurity.verify('token')).toBe(`VERIFIED(token:${secretOrPrivateKey})`)
    })

    it('should return the information from a valid token using a public key', async () => {
      jwt.verify = <jest.Mock>jest.fn((
        token: string,
        secretOrPublicKey: Secret | GetPublicKeyOrSecret,
        callback: VerifyCallback
      ) => {
        callback(null!, `VERIFIED(${token}:${secretOrPublicKey})`)
      })

      UserModule.getOptions().accessToken.secretOrPublicKey = secretOrPublicKey
      expect(await AccessTokenSecurity.verify('token')).toBe(`VERIFIED(token:${secretOrPublicKey})`)
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
      AccessTokenSecurity.verify = jest.fn(() => Promise.resolve({ _id: userId }))

      const req = {
        headers: {
          authorization: 'Bearer TOKEN'
        }
      } as Request
      const next = jest.fn()
      await AccessTokenSecurity.setRequestAuthMiddleware(req, {} as Response, next)
      expect(AccessTokenSecurity.verify).toHaveBeenCalledWith('TOKEN')
      expect(req.auth?._id).toBe(userId)
      expect(next).toHaveBeenCalled()
    })

    it('should not set auth info if the authorization is missing', async () => {
      AccessTokenSecurity.verify = jest.fn(() => Promise.resolve({ _id: userId }))

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
