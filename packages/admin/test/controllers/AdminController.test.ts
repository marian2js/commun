import { authenticatedRequest, closeTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun, ConfigManager, EntityConfig, EntityModel } from '@commun/core'
import { AdminModule } from '../../src'
import { UserConfig, UserModel } from '@commun/users'
import { JSONSchema7 } from 'json-schema'

describe('AdminController', () => {
  const collectionName = 'users'
  const baseUrl = '/api/v1/admin'
  let adminUser: UserModel
  let nonAdminUser: UserModel

  beforeEach(async () => {
    await AdminModule.setup()
    Commun.registerEntity({ config: UserConfig })
    Commun.registerPlugin('test-plugin', { config: { key: 123 } })
    await startTestApp(Commun)
    adminUser = await Commun.getEntityDao<UserModel>('users').insertOne({
      admin: true,
      username: 'admin',
      email: 'admin@example.org',
      password: 'admin',
      verified: true,
    })
    nonAdminUser = await Commun.getEntityDao<UserModel>('users').insertOne({
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
      const res = await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/entities`)
        .expect(200)
      expect(res.body.items[0]).toEqual(UserConfig)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/entities`)
        .expect(401)
      await authenticatedRequest(nonAdminUser.id)
        .get(`${baseUrl}/entities`)
        .expect(401)
    })
  })

  describe('create - [POST] /admin/entities', () => {
    it('should create a single entity', async () => {
      ConfigManager.createEntityConfig = jest.fn(() => Promise.resolve())

      const res = await authenticatedRequest(adminUser.id)
        .post(`${baseUrl}/entities`)
        .send({ entityName: 'test-entity' })
        .expect(200)
      expect(res.body.item).toEqual({
        entityName: 'test-entity',
        collectionName: 'test-entity',
        schema: {
          required: [],
          properties: {},
        }
      })

      expect(ConfigManager.createEntityConfig).toHaveBeenCalledWith('test-entity', {
        entityName: 'test-entity',
        collectionName: 'test-entity',
        schema: {
          required: [],
          properties: {},
        }
      })
    })

    it('should create an entity with user attribute', async () => {
      ConfigManager.createEntityConfig = jest.fn(() => Promise.resolve())

      const res = await authenticatedRequest(adminUser.id)
        .post(`${baseUrl}/entities`)
        .send({ entityName: 'test-entity', addUser: true })
        .expect(200)

      const expectedConfig: EntityConfig<EntityModel & { user: string }> = {
        entityName: 'test-entity',
        collectionName: 'test-entity',
        schema: {
          required: ['user'],
          properties: {
            user: {
              $ref: '#user',
              readOnly: true,
            }
          },
        },
        permissions: {
          get: 'anyone',
          create: 'user',
          update: 'own',
          delete: 'own',
          properties: {
            user: {
              create: 'system',
              update: 'system',
            }
          }
        },
        indexes: [{
          keys: {
            user: 1,
          }
        }],
      }

      expect(res.body.item).toEqual(expectedConfig)

      expect(ConfigManager.createEntityConfig).toHaveBeenCalledWith('test-entity', expectedConfig)
    })
  })

  describe('get - [GET] /admin/entities/:entityName', () => {
    it('should return a single entity', async () => {
      const res = await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/entities/users`)
        .expect(200)
      expect(res.body.item).toEqual(UserConfig)
    })

    it('should throw a not found error if the entity does not exist', async () => {
      await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/entities/404-entity`)
        .expect(404)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/entities`)
        .expect(401)
      await authenticatedRequest(nonAdminUser.id)
        .get(`${baseUrl}/entities`)
        .expect(401)
    })
  })

  describe('update - [PUT] /admin/entities/:entityName', () => {
    it('should update a single entity', async () => {
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<UserModel>]?: any }) =>
        Promise.resolve({ ...UserConfig, ...config }))

      const res = await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/entities/users`)
        .send({ test: 123 })
        .expect(200)
      expect(res.body.item).toEqual({ ...UserConfig, ...{ test: 123 } })
    })
  })

  describe('delete - [DELETE] /admin/entities/:entityName', () => {
    it('should delete a single entity', async () => {
      spyOn(ConfigManager, 'deleteEntity')

      const res = await authenticatedRequest(adminUser.id)
        .delete(`${baseUrl}/entities/test-entity`)
        .expect(200)

      expect(ConfigManager.deleteEntity).toHaveBeenCalledWith('test-entity')
    })
  })

  describe('updateEntityAttribute - [PUT] /admin/entities/:entityName/properties/:attributeKey', () => {
    it('should update a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve(UserConfig)) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<UserModel>]?: any }) =>
        Promise.resolve({ ...UserConfig, ...config }))

      const usernameProperty = UserConfig.schema.properties!.username as JSONSchema7

      const res = await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/entities/users/properties/username`)
        .send({ ...usernameProperty, default: 'default-username' })
        .expect(200)
      expect(res.body.item).toEqual({
        ...UserConfig,
        schema: {
          ...UserConfig.schema,
          properties: {
            ...UserConfig.schema.properties,
            username: {
              ...usernameProperty,
              default: 'default-username'
            }
          }
        }
      })
    })
  })

  describe('deleteEntityAttribute - [DELETE] /admin/entities/:entityName/properties/:attributeKey', () => {
    it('should delete a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve(UserConfig)) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<UserModel>]?: any }) =>
        Promise.resolve({ ...UserConfig, ...config }))

      const res = await authenticatedRequest(adminUser.id)
        .delete(`${baseUrl}/entities/users/properties/username`)
        .expect(200)

      const expectedProperties = { ...UserConfig.schema.properties }
      delete expectedProperties.username

      expect(res.body.item).toEqual({
        ...UserConfig,
        schema: {
          ...UserConfig.schema,
          properties: expectedProperties
        }
      })
    })
  })

  describe('updateEntityJoinAttribute - [PUT] /admin/entities/:entityName/joinProperties/:attributeKey', () => {
    it('should update a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({})) as jest.Mock
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<UserModel>]?: any }) =>
        Promise.resolve({ ...config })) as jest.Mock

      const res = await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/entities/users/joinProperties/test`)
        .send({ type: 'findOne', entity: 'user', query: {} })
        .expect(200)
      expect(res.body.item).toEqual({
        joinProperties: {
          test: {
            type: 'findOne',
            entity: 'user',
            query: {},
          },
        }
      })
    })
  })

  describe('deleteEntityJoinAttribute - [DELETE] /admin/entities/:entityName/joinProperties/:attributeKey', () => {
    it('should delete a single attribute', async () => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({
        joinProperties: {
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
      ConfigManager.mergeEntityConfig = jest.fn((name: string, config: { [key in keyof EntityConfig<UserModel>]?: any }) =>
        Promise.resolve({ ...config })) as jest.Mock

      const res = await authenticatedRequest(adminUser.id)
        .delete(`${baseUrl}/entities/users/joinProperties/test`)
        .expect(200)

      expect(res.body.item).toEqual({
        joinProperties: {
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
      const res = await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/plugins/test-plugin`)
        .expect(200)
      expect(res.body.item).toEqual({ key: 123 })
    })

    it('should throw a not found error if the plugin does not exist', async () => {
      await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/plugins/404-entity`)
        .expect(404)
    })

    it('should throw unauthorized error if the user is not admin', async () => {
      await request()
        .get(`${baseUrl}/plugins`)
        .expect(401)
      await authenticatedRequest(nonAdminUser.id)
        .get(`${baseUrl}/plugins`)
        .expect(401)
    })
  })

  describe('updatePlugin - [PUT] /admin/plugins/:pluginName', () => {
    it('should update a single plugin', async () => {
      ConfigManager.mergePluginConfig = jest.fn((name: string, config: any) =>
        Promise.resolve({ ...{ key: 123 }, ...config }))

      const res = await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/plugins/test-plugin`)
        .send({ test: 123 })
        .expect(200)
      expect(res.body.item).toEqual({ test: 123, key: 123 })
    })
  })

  describe('createOrUpdateEmailTemplate - [POST] /admin/plugins/:pluginName/templates', () => {
    it('should create a single template', async () => {
      ConfigManager.setPluginFile = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser.id)
        .post(`${baseUrl}/plugins/test-plugin/templates`)
        .send({ templateName: 'test-template', subject: 'email' })
        .expect(200)

      expect(ConfigManager.setPluginFile).toHaveBeenCalledWith('test-plugin', 'templates/test-template.json', {
        subject: 'email'
      })
    })

    it('should update a single template', async () => {
      ConfigManager.setPluginFile = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser.id)
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

      await authenticatedRequest(adminUser.id)
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
      await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/plugins/users/credentials/google`)
        .send({ id: 'id-value', secret: 'secret-value' })
        .expect(200)

      expect(ConfigManager.setEnvironmentVariable).toHaveBeenCalledWith({
        GOOGLE_CLIENT_ID: 'id-value',
        GOOGLE_CLIENT_SECRET: 'secret-value',
      })
    })

    it('should update the environment variables for Facebook', async () => {
      await authenticatedRequest(adminUser.id)
        .put(`${baseUrl}/plugins/users/credentials/facebook`)
        .send({ id: 'id-value', secret: 'secret-value' })
        .expect(200)

      expect(ConfigManager.setEnvironmentVariable).toHaveBeenCalledWith({
        FACEBOOK_APP_ID: 'id-value',
        FACEBOOK_APP_SECRET: 'secret-value',
      })
    })

    it('should update the environment variables for GitHub', async () => {
      await authenticatedRequest(adminUser.id)
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

      const res = await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/settings`)
        .expect(200)

      expect(res.body).toEqual({ env: { test: 1 } })
    })
  })

  describe('setCommunSettings - [POST] /admin/settings/:env', () => {
    it('should set settings for a given environment', async () => {
      ConfigManager.setCommunOptions = jest.fn(() => Promise.resolve())

      await authenticatedRequest(adminUser.id)
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
      AdminModule.getServerStartTime = jest.fn(() => 1234)

      const res = await authenticatedRequest(adminUser.id)
        .get(`${baseUrl}/server`)
        .expect(200)

      expect(res.body).toEqual({
        startTime: 1234,
        environment: 'development',
        communVersion: '1.2.3',
      })
    })
  })
})
