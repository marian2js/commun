import { Commun, EntityActionPermissions, ModelAttribute, SecurityUtils } from '@commun/core'
import { BaseUserController, BaseUserModel, DefaultUserConfig, UserModule } from '../../src'
import { request } from '../test-helpers/requestHelpers'

type PromiseType<T> = T extends Promise<infer U> ? U : never

describe('BaseUserController', () => {
  const baseUrl = '/api/v1/auth'
  const entityName = 'users'
  const collectionName = 'users'
  let dbConnection: PromiseType<ReturnType<typeof Commun.connectDb>>

  const registerUserEntity = async (
    permissions: EntityActionPermissions,
    attributes: { [key in keyof BaseUserModel]: ModelAttribute } = DefaultUserConfig.attributes) => {
    UserModule.setup({
      config: {
        ...DefaultUserConfig,
        permissions,
        attributes,
      }
    }, {
      accessToken: {
        secretOrPrivateKey: 'SECRET'
      }
    })
    await Commun.createDbIndexes()
    Commun.configureRoutes()
  }

  const getDao = () => Commun.getEntityDao<BaseUserModel>(entityName)
  const getController = () => Commun.getEntityDao<BaseUserModel>(entityName)

  beforeAll(async () => {
    dbConnection = await Commun.connectDb()
  })

  afterEach(async () => {
    try {
      dbConnection.getDb().collection(collectionName).drop()
    } catch (e) {}
  })

  afterAll(async () => {
    await Commun.closeDb()
  })

  describe('register with password - [POST] /auth/password', () => {
    it('should create an user', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        username: 'user',
        email: 'user@example.org',
        password: 'password',
      }
      const res = await request().post(`${baseUrl}/password`)
        .send(userData)
        .expect(200)
      expect(res.body.item.username).toBe('user')
      const user = (await getDao().findOne({ username: 'user' }))!
      expect(user.username).toBe('user')
      expect(user.email).toBe('user@example.org')
      expect(user.password).toBeDefined()
      expect(user.verified).toBe(false)
      expect(user.verificationCode).toBeDefined()
    })

    it('should return bad request without username', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        username: 'user',
        password: 'password',
      }
      const res = await request().post(`${baseUrl}/password`)
        .send(userData)
        .expect(400)
    })

    it('should return bad request without email', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        email: 'user@example.org',
        password: 'password',
      }
      const res = await request().post(`${baseUrl}/password`)
        .send(userData)
        .expect(400)
    })

    it('should return bad request without password', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        username: 'user',
        email: 'user@example.org',
      }
      await request().post(`${baseUrl}/password`)
        .send(userData)
        .expect(400)
    })
  })

  describe('login with password - [POST] /auth/password/login', () => {
    let userData: BaseUserModel

    beforeEach(async () => {
      SecurityUtils.bcryptHashIsValid = jest.fn((code, hash) => Promise.resolve(hash === `hashed(${code})`))

      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      userData = {
        username: 'user',
        email: 'user@example.org',
        password: 'hashed(password)',
        verified: true,
      }
      await getDao().insertOne(userData)
    })

    it('should return user and tokens if username and password are valid', async () => {
      const res = await request().post(`${baseUrl}/password/login`)
        .send({ username: 'user', password: 'password' })
        .expect(200)
      expect(res.body.user.username).toBe('user')
      expect(res.body.tokens.accessToken).toBeDefined()
      expect(res.body.tokens.accessTokenExpiration).toBeDefined()
      expect(res.body.tokens.refreshToken).toBeDefined()
    })

    it('should return user and tokens if email and password are valid', async () => {
      const res = await request().post(`${baseUrl}/password/login`)
        .send({ username: 'user@example.org', password: 'password' })
        .expect(200)
      expect(res.body.user.username).toBe('user')
      expect(res.body.tokens.accessToken).toBeDefined()
      expect(res.body.tokens.accessTokenExpiration).toBeDefined()
      expect(res.body.tokens.refreshToken).toBeDefined()
    })

    it('should return unauthorized error if password is not correct', async () => {
      const res = await request().post(`${baseUrl}/password/login`)
        .send({ username: 'user', password: 'wrong-password' })
        .expect(401)
    })
  })

  describe('get access token - [POST] /auth/token', () => {
    let userData: BaseUserModel

    beforeEach(async () => {
      SecurityUtils.bcryptHashIsValid = jest.fn((code, hash) => Promise.resolve(hash === `hashed(${code})`))

      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      userData = {
        username: 'user',
        email: 'user@example.org',
        password: 'password',
        verified: false,
        refreshTokenHash: 'hashed(REFRESH_TOKEN)'
      }
      await getDao().insertOne(userData)
    })

    it('should return the access token given a valid refresh token', async () => {
      const res = await request().post(`${baseUrl}/token`)
        .send({ username: userData.username, refreshToken: 'REFRESH_TOKEN' })
        .expect(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.accessTokenExpiration).toBeDefined()
    })

    it('should return an error if the refresh code is invalid', async () => {
      const res = await request().post(`${baseUrl}/token`)
        .send({ username: userData.username, refreshToken: 'INVALID_TOKEN' })
        .expect(401)
      expect(res.body.accessToken).toBeUndefined()
      expect(res.body.accessTokenExpiration).toBeUndefined()
    })
  })

  describe('verify - [POST] /auth/verify', () => {
    let userData: BaseUserModel

    beforeEach(async () => {
      SecurityUtils.bcryptHashIsValid = jest.fn((code, hash) => Promise.resolve(hash === `hashed(${code})`))

      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      userData = {
        username: 'user',
        email: 'user@example.org',
        password: 'password',
        verified: false,
        verificationCode: 'hashed(CODE)'
      }
      await getDao().insertOne(userData)
    })

    it('should verify an user given a valid verification code', async () => {
      await request().post(`${baseUrl}/verify`)
        .send({ code: 'CODE', username: userData.username })
        .expect(200)
      const user = (await getDao().findOne({ username: userData.username }))!
      expect(user.verified).toBe(true)
      expect(user.verificationCode).toBeFalsy()
    })

    it('should return an error if the verification code is invalid', async () => {
      await request().post(`${baseUrl}/verify`)
        .send({ code: 'wrong-code', username: userData.username })
        .expect(400)
      const user = (await getDao().findOne({ username: userData.username }))!
      expect(user.verified).toBe(false)
      expect(user.verificationCode).toBe('hashed(CODE)')
    })
  })
})
