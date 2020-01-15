import { Commun, EntityController, EntityDao, PluginController } from '../src'

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
          attributes: {}
        }
      })

      expect(Commun.getEntity('test')).toEqual({
        config: {
          entityName: 'test',
          collectionName: 'test',
          attributes: {
            _id: {
              type: 'id',
              permissions: {}
            }
          }
        },
        controller: expect.any(EntityController),
        dao: expect.any(EntityDao),
      })
    })

    it('should throw an error if an entity does not exist', async () => {
      expect(() => Commun.getEntity('test')).toThrow('Entity test not registered')
    })
  })

  describe('registerPlugin', () => {
    it('should register an entity with defaults', async () => {
      Commun.registerPlugin('test', {})

      expect(Commun.getPlugin('test')).toEqual({
        controller: expect.any(PluginController),
      })
    })

    it('should throw an error if an entity does not exist', async () => {
      expect(() => Commun.getPlugin('test')).toThrow('Plugin test not registered')
    })
  })
})
