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
    await AdminModule.setup()
    Commun.registerEntity({ config: DefaultUserConfig })
    Commun.registerPlugin('test-plugin', { config: { key: 123 } })
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

    it('should create an entity with user attribute', async () => {
      ConfigManager.createEntityConfig = jest.fn(() => Promise.resolve())

      const res = await authenticatedRequest(adminUser._id)
        .post(`${baseUrl}/entities`)
        .send({ entityName: 'test-entity', addUser: true })
        .expect(200)
      expect(res.body.item).toEqual({
        entityName: 'test-entity',
        collectionName: 'test-entity',
        attributes: {
          user: {
            type: 'user',
            required: true,
            index: true,
            readonly: true,
            permissions: {
              create: 'system',
              update: 'system',
            }
          }
        },
        permissions: {
          get: 'anyone',
          create: 'user',
          update: 'own',
          delete: 'own',
        }
      })

      expect(ConfigManager.createEntityConfig).toHaveBeenCalledWith('test-entity', {
        entityName: 'test-entity',
        collectionName: 'test-entity',
        attributes: {
          user: {
            type: 'user',
            required: true,
            index: true,
            readonly: true,
            permissions: {
              create: 'system',
              update: 'system',
            }
          }
        },
        permissions: {
          get: 'anyone',
          create: 'user',
          update: 'own',
          delete: 'own',
        }
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

  describe('getPlugin - [GET] /admin/plugins/:pluginName', () => {
    it('should return a single plugin', async () => {
      const res = await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/plugins/test-plugin`)
        .expect(200)
      expect(res.body.item).toEqual({ key: 123 })
    })

    it('should throw a not found error if the plugin does not exist', async () => {
      await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/plugins/404-entity`)
        .expect(404)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/plugins`)
        .expect(401)
      await authenticatedRequest(nonAdminUser._id)
        .get(`${baseUrl}/plugins`)
        .expect(401)
    })
  })

  describe('updatePlugin - [PUT] /admin/plugins/:pluginName', () => {
    it('should update a single plugin', async () => {
      ConfigManager.mergePluginConfig = jest.fn((name: string, config: any) =>
        Promise.resolve({ ...{ key: 123 }, ...config }))

      const res = await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/plugins/test-plugin`)
        .send({ test: 123 })
        .expect(200)
      expect(res.body.item).toEqual({ test: 123, key: 123 })
    })
  })

  describe('createOrUpdateEmailTemplate - [POST] /admin/plugins/:pluginName/templates', () => {
    it('should create a single template', async () => {
      ConfigManager.setPluginFile = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser._id)
        .post(`${baseUrl}/plugins/test-plugin/templates`)
        .send({ templateName: 'test-template', subject: 'email' })
        .expect(200)

      expect(ConfigManager.setPluginFile).toHaveBeenCalledWith('test-plugin', 'templates/test-template.json', {
        subject: 'email'
      })
    })

    it('should update a single template', async () => {
      ConfigManager.setPluginFile = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/plugins/test-plugin/templates/test-template`)
        .send({ subject: 'email' })
        .expect(200)

      expect(ConfigManager.setPluginFile).toHaveBeenCalledWith('test-plugin', 'templates/test-template.json', {
        subject: 'email'
      })
    })
  })

  describe('deleteEmailTemplate - [DELETE] /admin/plugins/:pluginName/templates/:templateName', () => {
    it('should delete a single template', async () => {
      ConfigManager.deletePluginFile = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser._id)
        .delete(`${baseUrl}/plugins/test-plugin/templates/test-template`)
        .expect(200)

      expect(ConfigManager.deletePluginFile).toHaveBeenCalledWith('test-plugin', 'templates/test-template.json')
    })
  })

  describe('updateSocialLoginCredentials - [GET]', () => {
    beforeEach(() => {
      ConfigManager.setEnvironmentVariable = jest.fn(() => Promise.resolve())
    })

    it('should update the environment variables for Google', async () => {
      await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/plugins/users/credentials/google`)
        .send({ id: 'id-value', secret: 'secret-value' })
        .expect(200)

      expect(ConfigManager.setEnvironmentVariable).toHaveBeenCalledWith({
        GOOGLE_CLIENT_ID: 'id-value',
        GOOGLE_CLIENT_SECRET: 'secret-value',
      })
    })

    it('should update the environment variables for Facebook', async () => {
      await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/plugins/users/credentials/facebook`)
        .send({ id: 'id-value', secret: 'secret-value' })
        .expect(200)

      expect(ConfigManager.setEnvironmentVariable).toHaveBeenCalledWith({
        FACEBOOK_APP_ID: 'id-value',
        FACEBOOK_APP_SECRET: 'secret-value',
      })
    })

    it('should update the environment variables for GitHub', async () => {
      await authenticatedRequest(adminUser._id)
        .put(`${baseUrl}/plugins/users/credentials/github`)
        .send({ id: 'id-value', secret: 'secret-value' })
        .expect(200)

      expect(ConfigManager.setEnvironmentVariable).toHaveBeenCalledWith({
        GITHUB_CLIENT_ID: 'id-value',
        GITHUB_CLIENT_SECRET: 'secret-value',
      })
    })
  })

  describe('getCommunSettings - [GET] /admin/settings', () => {
    it('should return settings for all environments', async () => {
      ConfigManager.getCommunOptions = jest.fn(() => Promise.resolve({ env: { test: 1 } })) as jest.Mock

      const res = await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/settings`)
        .expect(200)

      expect(res.body).toEqual({ env: { test: 1 } })
    })
  })

  describe('setCommunSettings - [POST] /admin/settings/:env', () => {
    it('should set settings for a given environment', async () => {
      ConfigManager.setCommunOptions = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser._id)
        .post(`${baseUrl}/settings/test-env`)
        .send({ test: 1 })
        .expect(200)

      expect(ConfigManager.setCommunOptions).toHaveBeenCalledWith('test-env', { test: 1 })
    })
  })

  describe('getServerSettings - [GET] /admin/server', () => {
    it('should return server settings', async () => {
      process.env.NODE_ENV = 'development'
      process.env.npm_package_dependencies__commun_core = '^1.2.3'

      const res = await authenticatedRequest(adminUser._id)
        .get(`${baseUrl}/server`)
        .expect(200)

      expect(res.body).toEqual({
        environment: 'development',
        communVersion: '1.2.3',
      })
    })
  })
})
