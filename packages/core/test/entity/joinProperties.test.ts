import { Commun, EntityModel, getJoinProperty } from '../../src'
import { FindManyJoinProperty, FindOneJoinProperty, JoinProperty } from '../../src/types'
import { ObjectId } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('joinProperties', () => {
  describe('getJoinProperty', () => {
    const entityName = 'joinProperties'
    const entitySingularName = 'joinProperty'
    const collectionName = entityName

    interface TestEntity extends EntityModel {
      name?: string
      user?: ObjectId
      ref?: ObjectId
    }

    const registerTestEntity = (joinProperties: { [key: string]: JoinProperty }, entity: string = entityName) => {
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
              user: {
                $ref: '#user',
              },
              ref: {
                $ref: '#entity/' + entitySingularName,
              }
            }
          },
          joinProperties
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
        const property: FindOneJoinProperty = {
          type: 'findOne',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1' })
        const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1.id) })
        expect(await getJoinProperty(property, item2)).toEqual(item1)
      })

      it('should return null if an item is not found', async () => {
        registerTestEntity({})
        const property: FindOneJoinProperty = {
          type: 'findOne',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1', ref: new ObjectId() })
        expect(await getJoinProperty(property, item1)).toBe(null)
      })

      it('should support auth user on the query', async () => {
        registerTestEntity({})
        registerTestEntity({}, 'users')
        const property: FindOneJoinProperty = {
          type: 'findOne',
          entity: entityName,
          query: {
            user: '{user.id}'
          }
        }
        const userId = new ObjectId()
        const item1 = await getDao().insertOne({ name: 'item1', user: userId })
        const item2 = await getDao().insertOne({ name: 'item2' })
        expect(await getJoinProperty(property, item2, userId.toString())).toEqual(item1)
      })
    })

    describe('findMany', () => {
      it('should find and return multiple items', async () => {
        registerTestEntity({})
        const property: FindManyJoinProperty = {
          type: 'findMany',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'target-item' })
        const item2 = await getDao().insertOne({ name: 'item2', ref: new ObjectId(item1.id) })
        const item3 = await getDao().insertOne({ name: 'target-item' })
        expect(await getJoinProperty(property, item2)).toEqual([item1, item3])
      })

      it('should return an empty array if items are not found', async () => {
        registerTestEntity({})
        const property: FindManyJoinProperty = {
          type: 'findMany',
          entity: entityName,
          query: {
            name: '{this.ref.name}'
          }
        }
        const item1 = await getDao().insertOne({ name: 'item1', ref: new ObjectId() })
        expect(await getJoinProperty(property, item1)).toEqual([])
      })

      it('should support auth user on the query', async () => {
        registerTestEntity({})
        registerTestEntity({}, 'users')
        const property: FindManyJoinProperty = {
          type: 'findMany',
          entity: entityName,
          query: {
            user: '{user.id}'
          }
        }
        const userId = new ObjectId()
        const item1 = await getDao().insertOne({ name: 'item1', user: userId })
        const item2 = await getDao().insertOne({ name: 'item2' })
        expect(await getJoinProperty(property, item2, userId.toString())).toEqual([item1])
      })
    })
  })
})
