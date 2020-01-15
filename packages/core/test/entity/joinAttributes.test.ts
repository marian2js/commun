import { Commun, EntityModel, getJoinAttribute } from '../../src'
import { FindManyJoinAttribute, FindOneJoinAttribute, JoinAttribute } from '../../src/types/JoinAttributes'
import { ObjectId } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('joinAttributes', () => {
  describe('getJoinAttribute', () => {
    const entityName = 'joinAttributes'
    const collectionName = entityName

    interface TestEntity extends EntityModel {
      name?: string
      user?: ObjectId
      ref?: ObjectId
    }

    const registerTestEntity = (joinAttributes: { [key: string]: JoinAttribute }, entity: string = entityName) => {
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
            user: {
              type: 'user',
            },
            ref: {
              type: 'ref',
              entity: entityName
            }
          },
          joinAttributes
        }
      })
    }

    const getDao = () => Commun.getEntityDao<TestEntity>(entityName)

    beforeAll(async () => await startTestApp(Commun))
    afterEach(async () => await stopTestApp(collectionName))
    afterAll(closeTestApp)

    describe('findOne', () => {
      it('should find and return a single item', async () => {
        registerTestEntity({})
        const attribute: FindOneJoinAttribute = {
          type: 'findOne',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1' })
        const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1._id) })
        expect(await getJoinAttribute(attribute, item2)).toEqual(item1)
      })

      it('should return null if an item is not found', async () => {
        registerTestEntity({})
        const attribute: FindOneJoinAttribute = {
          type: 'findOne',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1', ref: new ObjectId() })
        expect(await getJoinAttribute(attribute, item1)).toBe(null)
      })

      it('should support auth user on the query', async () => {
        registerTestEntity({})
        registerTestEntity({}, 'users')
        const attribute: FindOneJoinAttribute = {
          type: 'findOne',
          entity: entityName,
          query: {
            user: '{user._id}'
          }
        }
        const userId = new ObjectId()
        const item1 = await getDao().insertOne({ name: 'item1', user: userId })
        const item2 = await getDao().insertOne({ name: 'item2' })
        expect(await getJoinAttribute(attribute, item2, userId.toString())).toEqual(item1)
      })
    })

    describe('findMany', () => {
      it('should find and return multiple items', async () => {
        registerTestEntity({})
        const attribute: FindManyJoinAttribute = {
          type: 'findMany',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'target-item' })
        const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1._id) })
        const item3 = await getDao().insertOne({ name: 'target-item' })
        expect(await getJoinAttribute(attribute, item2)).toEqual([item1, item3])
      })

      it('should return an empty array if items are not found', async () => {
        registerTestEntity({})
        const attribute: FindManyJoinAttribute = {
          type: 'findMany',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1', ref: new ObjectId() })
        expect(await getJoinAttribute(attribute, item1)).toEqual([])
      })

      it('should support auth user on the query', async () => {
        registerTestEntity({})
        registerTestEntity({}, 'users')
        const attribute: FindManyJoinAttribute = {
          type: 'findMany',
          entity: entityName,
          query: {
            user: '{user._id}'
          }
        }
        const userId = new ObjectId()
        const item1 = await getDao().insertOne({ name: 'item1', user: userId })
        const item2 = await getDao().insertOne({ name: 'item2' })
        expect(await getJoinAttribute(attribute, item2, userId.toString())).toEqual([item1])
      })
    })
  })
})
