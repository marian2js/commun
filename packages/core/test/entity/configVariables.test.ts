import { Commun } from '../../src'
import { parseConfigString } from '../../src/entity/configVariables'
import { EntityModel } from '../../src/types'
import { ObjectId } from 'mongodb'
import { dbHelpers } from '../test-helpers/dbHelpers'

describe('configVariables', () => {
  const entityName = 'configVariables'
  const collectionName = entityName

  interface TestEntity extends EntityModel {
    name?: string
    num?: number
    user?: ObjectId
    ref?: ObjectId
  }

  const getDao = (entity: string = entityName) => Commun.getEntityDao<TestEntity>(entity)

  beforeAll(async () => {
    await Commun.connectDb()
  })

  afterEach(async () => {
    await dbHelpers.dropCollection(collectionName)
  })

  afterAll(async () => {
    await Commun.closeDb()
  })

  const registerTestEntity = (entity: string = entityName) => {
    Commun.registerEntity<TestEntity>({
      config: {
        entityName: entity,
        collectionName,
        permissions: {
          get: 'anyone',
          create: 'anyone',
          update: 'anyone',
          delete: 'anyone',
        },
        attributes: {
          name: {
            type: 'string'
          },
          num: {
            type: 'number'
          },
          user: {
            type: 'user',
          },
          ref: {
            type: 'ref',
            entity: entityName
          }
        }
      }
    })
  }

  describe('parseConfigString', () => {
    it('should return the value of the specified local attribute', async () => {
      registerTestEntity()
      expect(await parseConfigString<TestEntity>('{this.name}', entityName, { name: 'item' })).toBe('item')
      expect(await parseConfigString<TestEntity>(' { this.name } ', entityName, { name: 'item' })).toBe('item')
    })

    it('should return the value of the specified reference attribute', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1._id) })
      expect(await parseConfigString<TestEntity>('{this.ref.name}', entityName, item2)).toBe('item1')
      expect(await parseConfigString<TestEntity>(' { this.ref.name } ', entityName, item2)).toBe('item1')
    })

    it('should return the ID of the authenticated user', async () => {
      registerTestEntity('users')
      const userId = new ObjectId()
      expect(await parseConfigString<TestEntity>('{user._id}', entityName, {}, userId.toString())).toEqual(userId)
      expect(await parseConfigString<TestEntity>(' { user._id } ', entityName, {}, userId.toString())).toEqual(userId)
    })

    it('should return an attribute from the user', async () => {
      registerTestEntity('users')
      const user = await getDao('users').insertOne({ name: 'test-user' })
      const item = await getDao().insertOne({ user: new ObjectId(user._id) })
      expect(await parseConfigString<TestEntity>('{this.user.name}', entityName, item)).toEqual('test-user')
    })

    it('should return undefined if the value does not exist', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1._id) })
      expect(await parseConfigString<TestEntity>('{this.user}', entityName, item2)).toBeUndefined()
      expect(await parseConfigString<TestEntity>('{this.ref.user}', entityName, item2)).toBeUndefined()
      expect(await parseConfigString<TestEntity>('{user._id}', entityName, {})).toBeUndefined()
    })

    it('should return the given value if there are no variables', async () => {
      registerTestEntity()
      expect(await parseConfigString<TestEntity>('test', entityName, {})).toBe('test')
    })

    it('should return a string with multiple variables parsed', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1._id) })
      expect(await parseConfigString<TestEntity>('{this.name} --> {this.ref.name}', entityName, item2))
        .toBe('item2 --> item1')
      expect(await parseConfigString<TestEntity>('{ this.name } --> { this.ref.name }', entityName, item2))
        .toBe('item2 --> item1')
    })

    describe('Expressions', () => {
      it('should support expressions', async () => {
        registerTestEntity()
        expect(await parseConfigString<TestEntity>('{this.num+2}', entityName, { num: 3 })).toBe(5)
        expect(await parseConfigString<TestEntity>('{this.num + 2}', entityName, { num: 3 })).toBe(5)
        expect(await parseConfigString<TestEntity>('{2 + this.num}', entityName, { num: 3 })).toBe(5)
        expect(await parseConfigString<TestEntity>('{2-this.num}', entityName, { num: 3 })).toBe(-1)
        expect(await parseConfigString<TestEntity>('{this.num * 2 - this.num}', entityName, { num: 3 })).toBe(3)
        expect(await parseConfigString<TestEntity>('{this.num * (2 - this.num)}', entityName, { num: 3 })).toBe(-3)
        expect(await parseConfigString<TestEntity>('{this.num / 3}', entityName, { num: 3 })).toBe(1)
        expect(await parseConfigString<TestEntity>('{5 ^ 2 - 5}', entityName, { num: 3 })).toBe(20)
        expect(await parseConfigString<TestEntity>('{-this.num}', entityName, { num: 3 })).toBe(-3)
      })

      it('should throw an error if the expression is not valid', async () => {
        await expect(parseConfigString<TestEntity>('{this.num +}', entityName, { num: 3 }))
          .rejects.toThrow()
        await expect(parseConfigString<TestEntity>('{* this.num}', entityName, { num: 3 }))
          .rejects.toThrow()
        await expect(parseConfigString<TestEntity>('{this.num this.num}', entityName, { num: 3 }))
          .rejects.toThrow()
      })
    })
  })

})
