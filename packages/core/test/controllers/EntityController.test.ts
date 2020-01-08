import { Commun, EntityController, EntityModel } from '../../src'
import { request } from '../test-helpers/requestHelpers'
import { EntityActionPermissions, ModelAttribute } from '../../src/types'
import { dbHelpers } from '../test-helpers/dbHelpers'

describe('EntityController', () => {
  const entityName = 'items'
  const collectionName = 'items'
  const baseUrl = `/api/v1/${entityName}`

  interface TestEntity extends EntityModel {
    name: string
    num?: number
  }

  const registerTestEntity = async (
    permissions: EntityActionPermissions,
    attributes: { [key in keyof TestEntity]: ModelAttribute } = { name: { type: 'string' } }
  ) => {
    Commun.registerEntity<TestEntity>({
      config: {
        entityName,
        collectionName,
        permissions,
        attributes,
      }
    })
    await Commun.createDbIndexes()
  }

  const getDao = () => Commun.getEntityDao<TestEntity>(entityName)
  const getController = () => Commun.getEntityDao<TestEntity>(entityName)

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
      await registerTestEntity({ get: 'anyone' })
      await getDao().insertOne({ name: 'item1' })
      await getDao().insertOne({ name: 'item2' })
      await getDao().insertOne({ name: 'item3' })
      const res = await request().get(baseUrl).expect(200)
      expect(res.body.items.length).toBe(3)
      expect(res.body.items[0].name).toBe('item1')
      expect(res.body.items[1].name).toBe('item2')
      expect(res.body.items[2].name).toBe('item3')
    })

    it('should return an unauthorized error if get permission is not anyone', async () => {
      await registerTestEntity({})
      await getDao().insertOne({ name: 'item1' })
      await getDao().insertOne({ name: 'item2' })
      await getDao().insertOne({ name: 'item3' })
      await request().get(baseUrl).expect(401)
    })

    it('should not return values with get permission different of anyone', async () => {
      await registerTestEntity({
        get: 'anyone'
      }, {
        num: { type: 'number' },
        name: {
          type: 'string',
          permissions: {
            get: 'system'
          }
        }
      })
      await getDao().insertOne({ name: 'item1', num: 1 })
      await getDao().insertOne({ name: 'item2', num: 2 })
      await getDao().insertOne({ name: 'item3', num: 3 })
      const res = await request().get(baseUrl).expect(200)
      expect(res.body.items.length).toBe(3)
      expect(res.body.items[0].name).toBeUndefined()
      expect(res.body.items[0].num).toBe(1)
      expect(res.body.items[1].name).toBeUndefined()
      expect(res.body.items[1].num).toBe(2)
      expect(res.body.items[2].name).toBeUndefined()
      expect(res.body.items[2].num).toBe(3)
    })
  })

  describe('get - [GET] /:entity/:id', () => {
    it('should return a single item', async () => {
      await registerTestEntity({ get: 'anyone' })
      const item = await getDao().insertOne({ name: 'item' })
      const res = await request().get(`${baseUrl}/${item._id}`).expect(200)
      expect(res.body.item.name).toBe('item')
    })

    it('should return an unauthorized error if get permission is not anyone', async () => {
      await registerTestEntity({})
      const item = await getDao().insertOne({ name: 'item' })
      await request().get(`${baseUrl}/${item._id}`).expect(401)
    })

    it('should not return values with get permission different of anyone', async () => {
      await registerTestEntity({
        get: 'anyone'
      }, {
        num: { type: 'number' },
        name: {
          type: 'string',
          permissions: {
            get: 'system'
          }
        }
      })
      const item = await getDao().insertOne({ name: 'item1', num: 1 })
      const res = await request().get(`${baseUrl}/${item._id}`).expect(200)
      expect(res.body.item.name).toBeUndefined()
      expect(res.body.item.num).toBe(1)
    })
  })

  describe('create - [POST] /:entity', () => {
    it('should create an item', async () => {
      await registerTestEntity({ get: 'anyone', create: 'anyone' })
      const res = await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(200)
      expect(res.body.item.name).toBe('item')
      const item = await getDao().findOne({ name: 'item' })
      expect(item!.name).toBe('item')
    })

    it('should return an unauthorized error if create permission is not anyone', async () => {
      await registerTestEntity({})
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
      await registerTestEntity({ create: 'anyone' }, attributes)
      await getDao().insertOne({ name: 'item' })
      await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(400)
    })

    it('should not return values with get permission different of anyone', async () => {
      await registerTestEntity({
        get: 'anyone',
        create: 'anyone',
      }, {
        num: { type: 'number' },
        name: {
          type: 'string',
          permissions: {
            get: 'system'
          }
        }
      })
      const res = await request().post(baseUrl)
        .send({ name: 'item', num: 1 })
        .expect(200)
      expect(res.body.item.name).toBeUndefined()
      expect(res.body.item.num).toBe(1)
    })
  })

  describe('update - [PUT] /:entity/:id', () => {
    it('should update an item', async () => {
      await registerTestEntity({ update: 'anyone' })
      const item = await getDao().insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'updated' })
        .expect(200)
      const updatedItem = await getDao().findOneById(item._id!)
      expect(updatedItem!.name).toBe('updated')
    })

    it('should return an unauthorized error if create permission is not anyone', async () => {
      await registerTestEntity({})
      const item = await getDao().insertOne({ name: 'item' })
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
      await registerTestEntity({ update: 'anyone' }, attributes)
      await getDao().insertOne({ name: 'item1' })
      const item = await getDao().insertOne({ name: 'item2' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'item1' })
        .expect(400)
    })
  })

  describe('delete - [DELETE] /:entity/:id', () => {
    it('should delete an item', async () => {
      await registerTestEntity({ delete: 'anyone' })
      const item = await getDao().insertOne({ name: 'item' })
      await request().delete(`${baseUrl}/${item._id}`)
        .expect(200)
      const deletedItem = await getDao().findOneById(item._id!)
      expect(deletedItem).toBe(null)
    })

    it('should return an unauthorized error if create permission is not anyone', async () => {
      await registerTestEntity({})
      const item = await getDao().insertOne({ name: 'item' })
      await request().delete(`${baseUrl}/${item._id}`)
        .expect(401)
    })
  })
})
