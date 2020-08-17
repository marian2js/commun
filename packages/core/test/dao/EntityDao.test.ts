import { Commun, EntityDao } from '../../src'
import { MongoDbConnection } from '../../src/dao/MongoDbConnection'
import { Collection } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('EntityDao', () => {
  const entityName = 'entityDao'
  const collectionName = 'entityDao'
  let dao: EntityDao<{ id?: string, name: string }>
  let collection: Collection

  beforeEach(() => {
    dao = new EntityDao<{ id?: string, name: string }>(collectionName)
    collection = MongoDbConnection.getDb().collection(collectionName)
  })

  beforeAll(async () => await startTestApp(Commun))
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  describe('find', () => {
    it('should return multiple elements from mongodb', async () => {
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item2' })
      await dao.insertOne({ name: 'item3' })
      const items = await dao.find({})
      expect(items.length).toBe(3)
      expect(items[0].name).toBe('item1')
      expect(items[0].id).toBeDefined()
      expect(items[1].name).toBe('item2')
      expect(items[1].id).toBeDefined()
      expect(items[2].name).toBe('item3')
      expect(items[2].id).toBeDefined()
    })

    it('should return elements matching the filter from mongodb', async () => {
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item2' })
      await dao.insertOne({ name: 'item2' })
      const items = await dao.find({ name: 'item1' })
      expect(items.length).toBe(2)
      expect(items[0].name).toBe('item1')
      expect(items[1].name).toBe('item1')
    })
  })

  describe('findAndReturnCursor', () => {
    it('should return multiple elements from mongodb', async () => {
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item2' })
      await dao.insertOne({ name: 'item3' })
      const result = await dao.findAndReturnCursor({})
      expect(result.items.length).toBe(3)
      expect(result.items[0].name).toBe('item1')
      expect(result.items[0].id).toBeDefined()
      expect(result.items[1].name).toBe('item2')
      expect(result.items[1].id).toBeDefined()
      expect(result.items[2].name).toBe('item3')
      expect(result.items[2].id).toBeDefined()
      expect(await result.cursor.count()).toBe(3)
    })

    it('should return elements matching the filter from mongodb', async () => {
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item2' })
      await dao.insertOne({ name: 'item2' })
      const result = await dao.findAndReturnCursor({ name: 'item1' })
      expect(result.items.length).toBe(2)
      expect(result.items[0].name).toBe('item1')
      expect(result.items[1].name).toBe('item1')
      expect(await result.cursor.count()).toBe(2)
    })
  })

  describe('findOne', () => {
    it('should return a single element from mongodb', async () => {
      await dao.insertOne({ name: 'item1' })
      await dao.insertOne({ name: 'item2' })
      await dao.insertOne({ name: 'item3' })
      const item = await dao.findOne({ name: 'item2' })
      expect(item && item.name).toBe('item2')
    })
  })

  describe('findOneById', () => {
    it('should return a single element by id', async () => {
      const item1 = await dao.insertOne({ name: 'item1' })
      const item2 = await dao.insertOne({ name: 'item2' })
      const result1 = await dao.findOneById(item1.id!)
      expect(result1 && result1.name).toBe('item1')
      const result2 = await dao.findOneById(item2.id!)
      expect(result2 && result2.name).toBe('item2')
    })
  })

  describe('insertOne', () => {
    it('should insert an item into mongodb', async () => {
      const find1 = await dao.find({})
      expect(find1.length).toBe(0)
      await dao.insertOne({ name: 'item1' })
      const find2 = await dao.find({})
      expect(find2.length).toBe(1)
      expect(find2[0].name).toBe('item1')
    })
  })

  describe('updateOne', () => {
    it('should update an item on mongodb', async () => {
      const item = await dao.insertOne({ name: 'item' })
      await dao.updateOne(item.id!, { name: 'updated' })
      const itemUpdated = await dao.findOneById(item.id!)
      expect(itemUpdated!.name).toBe('updated')
    })
  })

  describe('deleteOne', () => {
    it('should delete an item from mongodb', async () => {
      const item = await dao.insertOne({ name: 'item' })
      const find1 = await dao.find({})
      expect(find1.length).toBe(1)
      await dao.deleteOne(item.id!)
      const find2 = await dao.find({})
      expect(find2.length).toBe(0)
    })
  })

  describe('createIndexes', () => {
    it('should create a unique index on MongoDB ', async () => {
      await dao.createIndexes({
        entityName,
        collectionName,
        schema: {},
        indexes: [{
          keys: {
            name: 1,
          },
          unique: true,
        }]
      })
      const index = (await collection.indexes()).find((index: { [key: string]: any }) => index.name === 'name_1')
      expect(index.unique).toBe(true)
    })

    it('should create a sparse index on MongoDB ', async () => {
      await dao.createIndexes({
        entityName,
        collectionName,
        schema: {},
        indexes: [{
          keys: {
            name: 1,
          },
          sparse: true,
        }]
      })
      const index = (await collection.indexes()).find((index: { [key: string]: any }) => index.name === 'name_1')
      expect(index.unique).toBeFalsy()
    })

    it('should create generic indexes from config', async () => {
      await dao.createIndexes({
        entityName,
        collectionName,
        schema: {},
        indexes: [{
          keys: {
            name: -1
          },
          name: 'new_index',
          unique: true,
          sparse: true,
          v: 1,
          expireAfterSeconds: 45,
          default_language: 'en'
        }]
      })
      const index = (await collection.indexes()).find((index: { [key: string]: any }) => index.name === 'new_index')
      expect(index.unique).toBe(true)
      expect(index.sparse).toBe(true)
      expect(index.v).toBe(1)
      expect(index.expireAfterSeconds).toBe(45)
      expect(index.default_language).toBe('en')
    })
  })
})
