import { Commun } from '../../src'
import { parseConfigString } from '../../src/entity/configVariables'
import { EntityModel } from '../../src/types'
import { ObjectId } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('configVariables', () => {
  const entityName = 'configVariables'
  const entitySingularName = 'configVariable'
  const collectionName = entityName

  interface TestEntity extends EntityModel {
    name?: string
    num?: number
    user?: ObjectId
    ref?: ObjectId
  }

  const getDao = (entity: string = entityName) => Commun.getEntityDao<TestEntity>(entity)

  beforeAll(async () => await startTestApp(Commun))
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

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
        schema: {
          properties: {
            name: {
              type: 'string'
            },
            num: {
              type: 'number'
            },
            user: {
              $ref: '#user',
            },
            ref: {
              $ref: '#entity/' + entitySingularName,
            },
          },
        }
      }
    })
  }

  describe('parseConfigString', () => {
    it('should return the value of the specified local property', async () => {
      registerTestEntity()
      expect(await parseConfigString<TestEntity>('{this.name}', entityName, { name: 'item' })).toBe('item')
      expect(await parseConfigString<TestEntity>(' { this.name } ', entityName, { name: 'item' })).toBe('item')
    })

    it('should return the value of the specified reference property', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1.id) })
      expect(await parseConfigString<TestEntity>('{this.ref.name}', entityName, item2)).toBe('item1')
      expect(await parseConfigString<TestEntity>(' { this.ref.name } ', entityName, item2)).toBe('item1')
    })

    it('should return the ID of the authenticated user', async () => {
      registerTestEntity('users')
      const userId = new ObjectId()
      expect(await parseConfigString<TestEntity>('{user.id}', entityName, {}, userId.toString())).toEqual(userId)
      expect(await parseConfigString<TestEntity>(' { user.id } ', entityName, {}, userId.toString())).toEqual(userId)
    })

    it('should return a property from the user', async () => {
      registerTestEntity('users')
      const user = await getDao('users').insertOne({ name: 'test-user' })
      const item = await getDao().insertOne({ user: new ObjectId(user.id) })
      expect(await parseConfigString<TestEntity>('{this.user.name}', entityName, item)).toEqual('test-user')
    })

    it('should return undefined if the value does not exist', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1.id) })
      expect(await parseConfigString<TestEntity>('{this.user}', entityName, item2)).toBeUndefined()
      expect(await parseConfigString<TestEntity>('{this.ref.user}', entityName, item2)).toBeUndefined()
      expect(await parseConfigString<TestEntity>('{user.id}', entityName, {})).toBeUndefined()
    })

    it('should return the given value if there are no variables', async () => {
      registerTestEntity()
      expect(await parseConfigString<TestEntity>('test', entityName, {})).toBe('test')
    })

    it('should return a string with multiple variables parsed', async () => {
      registerTestEntity()
      const item1 = await getDao().insertOne({ name: 'item1' })
      const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1.id) })
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

      it('should support the slug function', async () => {
        expect(await parseConfigString<TestEntity>('{slug("Test Slug!!!")}', entityName, {}))
          .toBe('test-slug')
        expect(await parseConfigString<TestEntity>('{slug(this.name)}', entityName, { name: '#Test Entity@' }))
          .toBe('test-entity')
      })

      it('should support the randomChars function', async () => {
        expect(await parseConfigString<TestEntity>('{randomChars(5)}', entityName, {}))
          .toHaveLength(5)
        const random1 = await parseConfigString<TestEntity>('{randomChars(5)}', entityName, {})
        const random2 = await parseConfigString<TestEntity>('{randomChars(5)}', entityName, {})
        expect(random1).not.toEqual(random2)
      })
    })
  })

})
