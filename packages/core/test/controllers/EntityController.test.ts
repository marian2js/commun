import { EntityModel, Commun, EntityConfig, EntityController } from '../../src'
import { request } from '../test-helpers/requestHelpers'
import { EntityActionPermissions } from '../../src/types/EntityPermission'
import { dbHelpers } from '../test-helpers/dbHelpers'
import { ModelAttribute } from '../../src/types/ModelAttribute'

describe('EntityController', () => {
  const entityName = 'items'
  const collectionName = 'items'
  const baseUrl = `/api/v1/${entityName}`

  interface TestEntity extends EntityModel {
    name: string
  }

  class TestController extends EntityController<TestEntity> {
    constructor (config: EntityConfig<TestEntity>) {
      super(config)
    }
  }

  const getController = (
    permissions: EntityActionPermissions,
    attributes: { [key in keyof TestEntity]: ModelAttribute } = { name: { type: 'string' } }
  ) => {
    const controller = new TestController({
      entityName,
      collectionName,
      permissions,
      attributes,
    })
    Commun.registerController(controller)
    return controller
  }

  beforeAll(async () => {
    await Commun.connectDb()
  })

  afterEach(async () => {
    await dbHelpers.dropCollection(collectionName)
  })

  afterAll(async () => {
    await Commun.closeDb()
  })

  describe('list - [GET] /:entity', () => {
    it('should return a list of entity items', async () => {
      const controller = getController({ get: 'public' })
      await controller.dao.insertOne({ name: 'item1' })
      await controller.dao.insertOne({ name: 'item2' })
      await controller.dao.insertOne({ name: 'item3' })
      const res = await request().get(baseUrl).expect(200)
      expect(res.body.items.length).toBe(3)
      expect(res.body.items[0].name).toBe('item1')
      expect(res.body.items[1].name).toBe('item2')
      expect(res.body.items[2].name).toBe('item3')
    })

    it('should return an unauthorized error if get permission is not public', async () => {
      const controller = getController({})
      await controller.dao.insertOne({ name: 'item1' })
      await controller.dao.insertOne({ name: 'item2' })
      await controller.dao.insertOne({ name: 'item3' })
      await request().get(baseUrl).expect(401)
    })
  })

  describe('get - [GET] /:entity/:id', () => {
    it('should return a single item', async () => {
      const controller = getController({ get: 'public' })
      const item = await controller.dao.insertOne({ name: 'item' })
      const res = await request().get(`${baseUrl}/${item._id}`).expect(200)
      expect(res.body.item.name).toBe('item')
    })

    it('should return an unauthorized error if get permission is not public', async () => {
      const controller = getController({})
      const item = await controller.dao.insertOne({ name: 'item' })
      await request().get(`${baseUrl}/${item._id}`).expect(401)
    })
  })

  describe('create - [POST] /:entity', () => {
    it('should create an item', async () => {
      const controller = getController({ create: 'public' })
      const res = await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(200)
      expect(res.body.item.name).toBe('item')
      const item = await controller.dao.findOne({ name: 'item' })
      expect(item!.name).toBe('item')
    })

    it('should return an unauthorized error if create permission is not public', async () => {
      getController({})
      await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(401)
    })

    it('should return an error if the name is unique and already exists', async () => {
      const attributes: { [key in keyof TestEntity]: ModelAttribute } = {
        name: {
          type: 'string',
          unique: true,
        }
      }
      const controller = getController({ create: 'public' }, attributes)
      await controller.dao.insertOne({ name: 'item' })
      await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(400)
    })
  })

  describe('update - [PUT] /:entity/:id', () => {
    it('should update an item', async () => {
      const controller = getController({ update: 'public' })
      const item = await controller.dao.insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'updated' })
        .expect(200)
      const updatedItem = await controller.dao.findOneById(item._id!)
      expect(updatedItem!.name).toBe('updated')
    })

    it('should return an unauthorized error if create permission is not public', async () => {
      const controller = getController({})
      const item = await controller.dao.insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'updated' })
        .expect(401)
    })

    it('should return an error if the name is unique and already exists', async () => {
      const attributes: { [key in keyof TestEntity]: ModelAttribute } = {
        name: {
          type: 'string',
          unique: true,
        }
      }
      const controller = getController({ update: 'public' }, attributes)
      await controller.dao.insertOne({ name: 'item1' })
      const item = await controller.dao.insertOne({ name: 'item2' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'item1' })
        .expect(400)
    })
  })

  describe('delete - [DELETE] /:entity/:id', () => {
    it('should delete an item', async () => {
      const controller = getController({ delete: 'public' })
      const item = await controller.dao.insertOne({ name: 'item' })
      await request().delete(`${baseUrl}/${item._id}`)
        .expect(200)
      const deletedItem = await controller.dao.findOneById(item._id!)
      expect(deletedItem).toBe(null)
    })

    it('should return an unauthorized error if create permission is not public', async () => {
      const controller = getController({})
      const item = await controller.dao.insertOne({ name: 'item' })
      await request().delete(`${baseUrl}/${item._id}`)
        .expect(401)
    })
  })
})
