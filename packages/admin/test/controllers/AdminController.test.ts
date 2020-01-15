import { authenticatedRequest, closeTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun } from '@commun/core'
import { AdminModule } from '../../src'
import { BaseUserModel, DefaultUserConfig, UserModule } from '@commun/users'

describe('AdminController', () => {
  const collectionName = 'adminController'
  const baseUrl = '/api/v1/admin'
  let adminUser: BaseUserModel
  let nonAdminUser: BaseUserModel

  beforeEach(async () => {
    AdminModule.setup()
    Commun.registerEntity({ config: DefaultUserConfig })
    await startTestApp(Commun)
    adminUser = await Commun.getEntityDao<BaseUserModel>('users').insertOne({
      admin: true,
      username: 'admin',
      email: 'admin@example.org',
      password: 'admin',
      verified: true,
    })
    nonAdminUser = await Commun.getEntityDao<BaseUserModel>('users').insertOne({
      admin: false,
      username: 'user',
      email: 'user@example.org',
      password: 'user',
      verified: true,
    })
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  describe('list - [GET] /admin/entities', () => {
    it('should return a list of entities', async () => {
      const res = await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/entities`)
        .expect(200)
      expect(res.body.items[0]).toEqual(DefaultUserConfig)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/entities`)
        .expect(401)
      await authenticatedRequest(nonAdminUser._id)
        .get(`${baseUrl}/entities`)
        .expect(401)
    })
  })

  describe('get - [GET] /admin/entities/:id', () => {
    it('should return a single entity', async () => {
      const res = await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/entities/users`)
        .expect(200)
      expect(res.body.item).toEqual(DefaultUserConfig)
    })

    it('should throw a not found error if the entity does not exist', async () => {
      await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/entities/404-entity`)
        .expect(404)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/entities`)
        .expect(401)
      await authenticatedRequest(nonAdminUser._id)
        .get(`${baseUrl}/entities`)
        .expect(401)
    })
  })
})
