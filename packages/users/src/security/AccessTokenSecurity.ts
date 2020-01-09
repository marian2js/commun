import jwt from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { UserModule } from '../UserModule'
import RequestAuth = Express.RequestAuth

export const AccessTokenSecurity = {
  sign: (payload: RequestAuth): Promise<string> => {
    const options = UserModule.getOptions()
    return new Promise(((resolve, reject) => {
      jwt.sign(payload, options.accessToken.secretOrPrivateKey, options.accessToken.signOptions || {}, (err, token) => {
        if (err) {
          return reject(err)
        }
        resolve(token)
      })
    }))
  },

  verify: (token: string): Promise<RequestAuth> => {
    return new Promise((resolve, reject) => {
      const accessTokenOptions = UserModule.getOptions().accessToken
      const secret = accessTokenOptions.secretOrPublicKey || accessTokenOptions.secretOrPrivateKey
      jwt.verify(token, secret, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data as RequestAuth)
      })
    })
  },

  setRequestAuthMiddleware: async (req: Request, res: Response, next: NextFunction) => {
    const { headers } = req
    const authHeader = headers.Authorization || headers.authorization
    const bearerToken = Array.isArray(authHeader) ? authHeader[0] : authHeader
    if (bearerToken && bearerToken.split(' ')[0] === 'Bearer') {
      const token = bearerToken.split(' ')[1]
      try {
        req.auth = await AccessTokenSecurity.verify(token)
      } catch (e) {}
    }
    next()
  },
}
