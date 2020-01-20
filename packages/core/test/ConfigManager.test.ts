import { ConfigManager } from '../src'

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.setRootPath('/test/')
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
        .toBe('/test/entities/test-entity/config.json')
    })
  })

  describe('readEnvConfig', () => {
    it('should return the config for the current environment', async () => {
      const config = await ConfigManager.readEnvConfig()
      expect(config).toEqual({ config: 'test' })
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/config/test.json')
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

      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/entities/entity-1/config.json')
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/entities/entity-2/config.json')
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/entities/entity-3/config.json')
    })
  })

  describe('readEntityConfig', () => {
    it('should return the config for a given entity', async () => {
      expect(await ConfigManager.readEntityConfig('test-entity')).toEqual({ config: 'test' })
      expect(ConfigManager._readFile).toHaveBeenCalledWith('/test/entities/test-entity/config.json')
    })
  })

  describe('setEntityConfig', () => {
    it('should write the configuration in the file', async () => {
      const config = { entityName: 'test', collectionName: 'test', attributes: {} }
      await ConfigManager.setEntityConfig('test-entity', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json', JSON.stringify(config, null, 2))
    })
  })

  describe('mergeEntityConfig', () => {
    it('should merge entity config keys into the existent configuration', async () => {
      const config = { permissions: { get: 'anyone' } }
      await ConfigManager.mergeEntityConfig('test-entity', config)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json', JSON.stringify({
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
        .toHaveBeenCalledWith('/test/entities/test-entity')
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json', JSON.stringify(config, null, 2))
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
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json')
      expect(ConfigManager._unlink)
        .toHaveBeenCalledWith('/test/entities/test-entity/another-file')
      expect(ConfigManager._rmdir)
        .toHaveBeenCalledWith('/test/entities/test-entity')
    })
  })
})
