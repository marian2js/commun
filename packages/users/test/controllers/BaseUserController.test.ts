import { Commun, EntityActionPermissions, ModelAttribute } from '@commun/core'
import { BaseUserController, BaseUserModel, DefaultUserConfig } from '../../src'
import { request } from '../test-helpers/requestHelpers'

type PromiseType<T> = T extends Promise<infer U> ? U : never

describe('BaseUserController', () => {
  const baseUrl = '/api/v1/users'
  const entityName = 'users'
  const collectionName = 'users'
  let dbConnection: PromiseType<ReturnType<typeof Commun.connectDb>>

  const registerUserEntity = async (
    permissions: EntityActionPermissions,
    attributes: { [key in keyof BaseUserModel]: ModelAttribute } = DefaultUserConfig.attributes) => {
    Commun.registerEntity<BaseUserModel>({
      config: {
        ...DefaultUserConfig,
        permissions,
        attributes,
      },
      controller: new BaseUserController(entityName),
    })
    await Commun.createDbIndexes()
  }

  const getDao = () => Commun.getEntityDao<BaseUserModel>(entityName)
  const getController = () => Commun.getEntityDao<BaseUserModel>(entityName)

  beforeAll(async () => {
    dbConnection = await Commun.connectDb()
  })

  afterEach(async () => {
    dbConnection.getDb().collection(collectionName).drop()
  })

  afterAll(async () => {
    await Commun.closeDb()
  })

  describe('create - [POST] /users', () => {
    it('should create an user', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        username: 'user',
        email: 'user@example.org',
        password: 'password',
      }
      const res = await request().post(baseUrl)
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
      const res = await request().post(baseUrl)
        .send(userData)
        .expect(400)
    })

    it('should return bad request without email', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        email: 'user@example.org',
        password: 'password',
      }
      const res = await request().post(baseUrl)
        .send(userData)
        .expect(400)
    })

    it('should return bad request without password', async () => {
      await registerUserEntity({ get: 'anyone', create: 'anyone' })
      const userData = {
        username: 'user',
        email: 'user@example.org',
      }
      const res = await request().post(baseUrl)
        .send(userData)
        .expect(400)
    })
  })
})
