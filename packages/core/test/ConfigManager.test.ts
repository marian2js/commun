import { CommunOptions, ConfigManager } from '../src'

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.setRootPath('/test/dist')
    spyOn(ConfigManager, '_writeFile')
    spyOn(ConfigManager, '_mkdir')
    spyOn(ConfigManager, '_unlink')
    spyOn(ConfigManager, '_rmdir')
    ConfigManager._readFile = jest.fn(() =>
      Promise.resolve(JSON.stringify({ config: 'test' }))) as jest.Mock
  })
  afterEach(() => jest.clearAllMocks())

  describe('getEntityConfigFilePath', () => {
    it('should return the path for a given entity', async () => {
      expect(ConfigManager.getEntityConfigFilePath('test-entity'))
        .toBe('/test/src/entities/test-entity/config.json')
    })
  })

  describe('readEnvConfig', () => {
    it('should return the config for the current environment', async () => {
      const config = await ConfigManager.readEnvConfig()
      expect(config).toEqual({ config: 'test' })
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/config/test.json')
    })
  })

  describe('getEntityConfigs', () => {
    it('should return the config files for all entities', async () => {
      ConfigManager._readdir = jest.fn(() => Promise.resolve([
        'entity-1', 'entity-2', 'entity-3'
      ])) as jest.Mock

      expect(await ConfigManager.getEntityConfigs()).toEqual([{
        config: 'test'
      }, {
        config: 'test'
      }, {
        config: 'test'
      }])

      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/entities/entity-1/config.json')
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/entities/entity-2/config.json')
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/entities/entity-3/config.json')
    })
  })

  describe('readEntityConfig', () => {
    it('should return the config for a given entity', async () => {
      expect(await ConfigManager.readEntityConfig('test-entity')).toEqual({ config: 'test' })
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/entities/test-entity/config.json')
    })
  })

  describe('setEntityConfig', () => {
    it('should write the configuration in the file', async () => {
      const config = { entityName: 'test', collectionName: 'test', attributes: {} }
      await ConfigManager.setEntityConfig('test-entity', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/entities/test-entity/config.json', JSON.stringify(config, null, 2))
    })
  })

  describe('mergeEntityConfig', () => {
    it('should merge entity config keys into the existent configuration', async () => {
      const config = { permissions: { get: 'anyone' } }
      await ConfigManager.mergeEntityConfig('test-entity', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/entities/test-entity/config.json', JSON.stringify({
          config: 'test',
          ...config,
        }, null, 2))
    })
  })

  describe('createEntityConfig', () => {
    it('should create an entity', async () => {
      ConfigManager._exists = jest.fn(() => Promise.resolve(false))

      const config = { entityName: 'tests', collectionName: 'tests', attributes: {} }
      await ConfigManager.createEntityConfig('test-entity', config)
      expect(ConfigManager._mkdir)
        .toHaveBeenCalledWith('/test/src/entities/test-entity')
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/entities/test-entity/config.json', JSON.stringify(config, null, 2))
    })
  })

  describe('deleteEntityConfig', () => {
    it('should delete an entity', async () => {
      ConfigManager._exists = jest.fn(() => Promise.resolve(true))
      ConfigManager._readdir = jest.fn(() => Promise.resolve([
        'config.json', 'another-file'
      ])) as jest.Mock

      await ConfigManager.deleteEntity('test-entity')

      expect(ConfigManager._unlink)
        .toHaveBeenCalledWith('/test/src/entities/test-entity/config.json')
      expect(ConfigManager._unlink)
        .toHaveBeenCalledWith('/test/src/entities/test-entity/another-file')
      expect(ConfigManager._rmdir)
        .toHaveBeenCalledWith('/test/src/entities/test-entity')
    })
  })

  describe('getPluginPath', () => {
    it('should return the path for a plugin', async () => {
      expect(ConfigManager.getPluginPath('test-plugin')).toBe('/test/src/plugins/test-plugin')
    })
  })

  describe('getPluginSetupModulePath', () => {
    it('should return the path for the setup module of a plugin', async () => {
      expect(ConfigManager.getPluginSetupModulePath('test-plugin')).toBe('/test/dist/plugins/test-plugin/setup.js')
    })
  })

  describe('getPluginConfigFilePath', () => {
    it('should return the path for the config file of a plugin', async () => {
      expect(ConfigManager.getPluginConfigFilePath('test-plugin')).toBe('/test/src/plugins/test-plugin/config.json')
    })
  })

  describe('getPluginNames', () => {
    it('should return a list of plugins', async () => {
      ConfigManager._readdir = jest.fn(() => Promise.resolve([
        'plugin-1', 'plugin-2'
      ])) as jest.Mock

      expect(await ConfigManager.getPluginNames()).toEqual(['plugin-1', 'plugin-2'])
    })
  })

  describe('runPluginSetup', () => {
    it('should run a plugin setup', async () => {
      const setupPluginFn = jest.fn(() => {})
      jest.mock('/test/dist/plugins/plugin-1/setup.js', () => ({
        default: setupPluginFn
      }), { virtual: true })

      await ConfigManager.runPluginSetup('plugin-1')
      expect(setupPluginFn).toHaveBeenCalledWith()
    })
  })

  describe('readPluginConfig', () => {
    it('should return the config for a given plugin', async () => {
      expect(await ConfigManager.readPluginConfig('test-plugin')).toEqual({ config: 'test' })
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/src/plugins/test-plugin/config.json')
    })
  })

  describe('setPluginFile', () => {
    it('should write a file in the plugin directory', async () => {
      const config = { key: 123 }
      await ConfigManager.setPluginFile('test-plugin', 'folder/file.json', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/plugins/test-plugin/folder/file.json', JSON.stringify(config, null, 2))
    })
  })

  describe('deletePluginFile', () => {
    it('should write a file in the plugin directory', async () => {
      await ConfigManager.deletePluginFile('test-plugin', 'folder/file.json')
      expect(ConfigManager._unlink)
        .toHaveBeenCalledWith('/test/src/plugins/test-plugin/folder/file.json')
    })
  })

  describe('setPluginConfig', () => {
    it('should write the configuration in the file', async () => {
      const config = { key: 123 }
      await ConfigManager.setPluginConfig('test-plugin', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/plugins/test-plugin/config.json', JSON.stringify(config, null, 2))
    })
  })

  describe('mergePluginConfig', () => {
    it('should merge plugin config keys into the existent configuration', async () => {
      const config = { key: 123 }
      await ConfigManager.mergePluginConfig('test-plugin', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/plugins/test-plugin/config.json', JSON.stringify({
          config: 'test',
          ...config,
        }, null, 2))
    })
  })

  describe('getCommunOptions', () => {
    it('should return the environment options', async () => {
      ConfigManager._readdir = jest.fn(() => Promise.resolve([
        'env-1', 'env-2'
      ])) as jest.Mock

      expect(await ConfigManager.getCommunOptions()).toEqual({
        'env-1': {
          config: 'test'
        },
        'env-2': {
          config: 'test'
        }
      })
    })
  })

  describe('setCommunOptions', () => {
    it('should save the options for a given environment', async () => {
      await ConfigManager.setCommunOptions('test-env', { appName: 'test' } as CommunOptions)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/src/config/test-env.json', JSON.stringify({ appName: 'test' }, null, 2))
    })
  })

  describe('getKeys', () => {
    it('should return public and private keys', async () => {
      expect(await ConfigManager.getKeys('test-key')).toEqual({
        privateKey: JSON.stringify({ config: 'test' }),
        publicKey: JSON.stringify({ config: 'test' }),
      })
      expect(ConfigManager._readFile)
        .toHaveBeenCalledWith('/test/keys/test-key.pem')
      expect(ConfigManager._readFile)
        .toHaveBeenCalledWith('/test/keys/test-key.pub')
    })
  })
})
