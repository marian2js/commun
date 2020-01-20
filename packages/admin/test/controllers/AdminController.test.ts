import { authenticatedRequest, closeTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun, ConfigManager, EntityConfig } from '@commun/core'
import { AdminModule } from '../../src'
import { BaseUserModel, DefaultUserConfig } from '@commun/users'

describe('AdminController', () => {
  const collectionName = 'users'
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
      username: 'non-admin',
      email: 'non-admin@example.org',
      password: 'non-admin',
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

  describe('create - [POST] /admin/entities', () => {
    it('should create a single entity', async () => {
      ConfigManager.createEntityConfig = jest.fn(() => Promise.resolve())

      const res = await authenticatedRequest(adminUser._id)
        .post(`${baseUrl}/entities`)
        .send({ entityName: 'test-entity' })
        .expect(200)
      expect(res.body.item).toEqual({
        entityName: 'test-entity',
        collectionName: 'test-entity',
        attributes: {}
      })

      expect(ConfigManager.createEntityConfig).toHaveBeenCalledWith('test-entity', {
        entityName: 'test-entity',
        collectionName: 'test-entity',
        attributes: {}
      })
    })
  })

  describe('get - [GET] /admin/entities/:entityName', () => {
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

  describe('update - [PUT] /admin/entities/:entityName', () => {
    it('should update a single entity', async () => {
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<BaseUserModel>]?: any }) =>
        Promise.resolve({ ...DefaultUserConfig, ...config }))

      const res = await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/entities/users`)
        .send({ test: 123 })
        .expect(200)
      expect(res.body.item).toEqual({ ...DefaultUserConfig, ...{ test: 123 } })
    })
  })

  describe('delete - [DELETE] /admin/entities/:entityName', () => {
    it('should delete a single entity', async () => {
      spyOn(ConfigManager, 'deleteEntity')

      const res = await authenticatedRequest(adminUser._id)
        .delete(`${baseUrl}/entities/test-entity`)
        .expect(200)

      expect(ConfigManager.deleteEntity).toHaveBeenCalledWith('test-entity')
    })
  })

  describe('updateEntityAttribute - [PUT] /admin/entities/:entityName/attributes/:attributeKey', () => {
    it('should update a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve(DefaultUserConfig)) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<BaseUserModel>]?: any }) =>
        Promise.resolve({ ...DefaultUserConfig, ...config }))

      const res = await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/entities/users/attributes/username`)
        .send({ ...DefaultUserConfig.attributes.username, default: 'default-username' })
        .expect(200)
      expect(res.body.item).toEqual({
        ...DefaultUserConfig,
        attributes: {
          ...DefaultUserConfig.attributes,
          username: {
            ...DefaultUserConfig.attributes.username,
            default: 'default-username'
          }
        }
      })
    })
  })

  describe('deleteEntityAttribute - [DELETE] /admin/entities/:entityName/attributes/:attributeKey', () => {
    it('should delete a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve(DefaultUserConfig)) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<BaseUserModel>]?: any }) =>
        Promise.resolve({ ...DefaultUserConfig, ...config }))

      const res = await authenticatedRequest(adminUser._id)
        .delete(`${baseUrl}/entities/users/attributes/username`)
        .expect(200)

      const expectedAttributes = { ...DefaultUserConfig.attributes }
      delete expectedAttributes.username

      expect(res.body.item).toEqual({
        ...DefaultUserConfig,
        attributes: expectedAttributes
      })
    })
  })

  describe('updateEntityJoinAttribute - [PUT] /admin/entities/:entityName/joinAttributes/:attributeKey', () => {
    it('should update a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({})) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<BaseUserModel>]?: any }) =>
        Promise.resolve({ ...config })) as jest.Mock

      const res = await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/entities/users/joinAttributes/test`)
        .send({ type: 'findOne', entity: 'user', query: {} })
        .expect(200)
      expect(res.body.item).toEqual({
        joinAttributes: {
          test: {
            type: 'findOne',
            entity: 'user',
            query: {},
          },
        }
      })
    })
  })

  describe('deleteEntityJoinAttribute - [DELETE] /admin/entities/:entityName/joinAttributes/:attributeKey', () => {
    it('should delete a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({
        joinAttributes: {
          test: {
            type: 'findOne',
            entity: 'user',
            query: {},
          },
          test2: {
            type: 'findOne',
            entity: 'user',
            query: {},
          },
        },
      })) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<BaseUserModel>]?: any }) =>
        Promise.resolve({ ...config })) as jest.Mock

      const res = await authenticatedRequest(adminUser._id)
        .delete(`${baseUrl}/entities/users/joinAttributes/test`)
        .expect(200)

      expect(res.body.item).toEqual({
        joinAttributes: {
          test2: {
            type: 'findOne',
            entity: 'user',
            query: {},
          }
        }
      })
    })
  })
})
