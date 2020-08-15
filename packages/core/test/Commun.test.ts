import { Commun, ConfigManager, EntityController, EntityDao, PluginController } from '../src'

describe('Commun', () => {
  beforeEach(() => {
    Commun.deregisterAll()
  })

  describe('registerEntity', () => {
    it('should register an entity with defaults', async () => {
      Commun.registerEntity({
        config: {
          entityName: 'test',
          collectionName: 'test',
          schema: {}
        }
      })

      expect(Commun.getEntity('test')).toEqual({
        config: {
          entityName: 'test',
          collectionName: 'test',
          entitySingularName: 'testItem',
          apiKey: 'id',
          schema: {
            $id: '#entity/testItem',
            properties: {
              id: {
                type: 'string',
                format: 'id',
              },
              createdAt: {
                type: 'object',
                format: 'date-time',
              },
              updatedAt: {
                type: 'object',
                format: 'date-time',
              }
            }
          },
          permissions: {
            properties: {
              createdAt: {
                get: 'system',
                create: 'system',
                update: 'system',
              },
              updatedAt: {
                get: 'system',
                create: 'system',
                update: 'system',
              }
            },
          },
        },
        controller: expect.any(EntityController),
        dao: expect.any(EntityDao),
      })
    })

    it('should throw an error if an entity does not exist', async () => {
      expect(() => Commun.getEntity('test')).toThrow('Entity test not registered')
    })

    it('should set a singular entity name if one was not given', async () => {
      Commun.registerEntity({
        config: {
          entityName: 'posts',
          collectionName: 'posts',
          schema: {}
        }
      })

      expect(Commun.getEntity('posts').config.entitySingularName).toBe('post')

      Commun.registerEntity({
        config: {
          entityName: 'test',
          collectionName: 'test',
          entitySingularName: 'singleTest',
          schema: {}
        }
      })

      expect(Commun.getEntity('test').config.entitySingularName).toBe('singleTest')
    })
  })

  describe('_registerEntitiesFromConfigFiles', () => {
    const configFiles = ['entity-1', 'entity-2', 'entity-3'].map(name => ({
      entityName: name,
      collectionName: name,
      schema: {}
    }))

    it('should register entities from config files', async () => {
      ConfigManager.getEntityConfigs = jest.fn(() => Promise.resolve(configFiles)) as jest.Mock
      ConfigManager.getEntityCodeHooks = jest.fn(() => Promise.resolve({})) as jest.Mock
      await Commun._registerEntitiesFromConfigFiles()
      expect(Commun.getEntityConfig('entity-1')).toEqual(configFiles[0])
      expect(Commun.getEntityConfig('entity-2')).toEqual(configFiles[1])
      expect(Commun.getEntityConfig('entity-3')).toEqual(configFiles[2])
    })

    it('should register entity code hooks', async () => {
      ConfigManager.getEntityConfigs = jest.fn(() => Promise.resolve(configFiles)) as jest.Mock
      ConfigManager.getEntityCodeHooks = jest.fn(() => Promise.resolve({
        afterCreate: () => {},
        beforeDelete: () => {},
      })) as jest.Mock
      await Commun._registerEntitiesFromConfigFiles()
      expect(Commun.getEntity('entity-1').codeHooks).toEqual({
        afterCreate: expect.any(Function),
        beforeDelete: expect.any(Function),
      })
    })
  })

  describe('_setupPlugins', () => {
    it('should register entities from config files', async () => {
      const plugins = ['plugin-1', 'plugin-2']
      ConfigManager.getPluginNames = jest.fn(() => Promise.resolve(plugins))
      spyOn(ConfigManager, 'runPluginSetup')
      await Commun._setupPlugins()
      expect(ConfigManager.runPluginSetup).toHaveBeenCalledWith('plugin-1')
      expect(ConfigManager.runPluginSetup).toHaveBeenCalledWith('plugin-2')
    })
  })

  describe('registerPlugin', () => {
    it('should register an entity with defaults', async () => {
      Commun.registerPlugin('test', {})

      expect(Commun.getPlugin('test')).toEqual({
        config: {},
        controller: expect.any(PluginController),
      })
    })

    it('should throw an error if an entity does not exist', async () => {
      expect(() => Commun.getPlugin('test')).toThrow('Plugin test not registered')
    })
  })
})
