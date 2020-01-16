import { ConfigManager } from '../src'

describe('ConfigManager', () => {
  beforeEach(() => {
    ConfigManager.setRootPath('/test/')
    spyOn(ConfigManager, 'writeFile')
    ConfigManager.readFile = jest.fn(() =>
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
      expect(ConfigManager.readFile).toHaveBeenCalledWith('/test/config/test.json')
    })
  })

  describe('readEntityConfig', () => {
    it('should return the config for a given entity', async () => {
      expect(await ConfigManager.readEntityConfig('test-entity')).toEqual({ config: 'test' })
      expect(ConfigManager.readFile).toHaveBeenCalledWith('/test/entities/test-entity/config.json')
    })
  })

  describe('setEntityConfig', () => {
    it('should write the configuration in the file', async () => {
      const config = { entityName: 'test', collectionName: 'test', attributes: {} }
      await ConfigManager.setEntityConfig('test-entity', config)
      expect(ConfigManager.writeFile)
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json', JSON.stringify(config, null, 2))
    })
  })

  describe('mergeEntityConfig', () => {
    it('should merge entity config keys into the existent configuration', async () => {
      const config = { permissions: { get: 'anyone' } }
      await ConfigManager.mergeEntityConfig('test-entity', config)
      expect(ConfigManager.writeFile)
        .toHaveBeenCalledWith('/test/entities/test-entity/config.json', JSON.stringify({
          config: 'test',
          ...config,
        }, null, 2))
    })
  })
})
