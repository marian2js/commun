import { Commun, EntityModel } from '@commun/core'
import { GraphQLModule } from '../../src'
import { closeTestApp, getTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { ObjectId } from 'mongodb'

describe('GraphQLController', () => {
  const entityName = 'items'
  const collectionName = 'items'

  interface TestEntity extends EntityModel {
    name: string
  }

  beforeAll(async () => {
    Commun.registerEntity<TestEntity>({
      config: {
        entityName,
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
        },
      }
    })
    await startTestApp(Commun)
    process.env.NODE_ENV = 'development'
    await GraphQLModule.setupGraphql(getTestApp())
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  const getDao = () => Commun.getEntityDao<TestEntity>(entityName)

  describe('listEntities', () => {
    it('should return a list of items', async () => {
      await getDao().insertOne({ name: 'item1' })
      await getDao().insertOne({ name: 'item2' })
      await getDao().insertOne({ name: 'item3' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `{
               items {
                 nodes {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          items: {
            nodes: [{
              name: 'item1'
            }, {
              name: 'item2'
            }, {
              name: 'item3'
            }]
          }
        }
      })
    })

    describe('OrderBy', () => {
      beforeEach(async () => {
        await getDao().insertOne({ name: 'b' })
        await getDao().insertOne({ name: 'a' })
        await getDao().insertOne({ name: 'd' })
        await getDao().insertOne({ name: 'c' })
      })

      it('should return a list of items sorted by name asc', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (orderBy: [{ name: ASC }]) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)

        expect(res.body).toEqual({
          data: {
            items: {
              nodes: [{
                name: 'a'
              }, {
                name: 'b'
              }, {
                name: 'c'
              }, {
                name: 'd'
              }]
            }
          }
        })
      })

      it('should return a list of items sorted by name desc', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (orderBy: [{ name: DESC }]) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)

        expect(res.body).toEqual({
          data: {
            items: {
              nodes: [{
                name: 'd'
              }, {
                name: 'c'
              }, {
                name: 'b'
              }, {
                name: 'a'
              }]
            }
          }
        })
      })
    })

    describe('Filter', () => {
      beforeEach(async () => {
        await getDao().insertOne({ name: 'b' })
        await getDao().insertOne({ name: 'a' })
        await getDao().insertOne({ name: 'd' })
        await getDao().insertOne({ name: 'c' })
      })

      it('should return a list of items filtered by name', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (filter: { name: { value: "a" } }) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)

        expect(res.body).toEqual({
          data: {
            items: {
              nodes: [{
                name: 'a'
              }]
            }
          }
        })
      })

      it('should return a list of items filtered by multiple names', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (filter: { or: [{ name: { value: "a" } }, { name: { value: "b" } }] }) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)

        expect(res.body).toEqual({
          data: {
            items: {
              nodes: [{
                name: 'b'
              }, {
                name: 'a'
              }]
            }
          }
        })
      })
    })
  })

  describe('getEntity', () => {
    it('should return a single item by id', async () => {
      const node = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `{
               item (_id: "${node._id}") {
                 name
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          item: {
            name: 'test'
          }
        }
      })
    })

    it('should throw an error if the item does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `{
               item (_id: "${new ObjectId()}") {
                 name
               }
             }`
        })
        .expect(500)

      expect(res.body).toEqual({
        errors: [{
          message: 'Resource Not Found',
          path: ['item'],
          locations: expect.any(Array),
        }],
        data: null,
      })
    })
  })

  describe('createEntity', () => {
    it('should create an item', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               createItem (input: { name: "new-item" }) {
                 item {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          createItem: {
            item: {
              name: 'new-item'
            }
          }
        }
      })

      expect(await getDao().findOne({ name: 'new-item' })).toBeDefined()
    })
  })

  describe('updateEntity', () => {
    it('should update an item', async () => {
      const item = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               updateItem (input: { _id: "${item._id}", name: "updated" }) {
                 item {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          updateItem: {
            item: {
              name: 'updated'
            }
          }
        }
      })

      expect((await getDao().findOneById(item._id!))!.name).toEqual('updated')
    })

    it('should throw an error if the item does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               updateItem (input: { _id: "${new ObjectId()}", name: "updated" }) {
                 item {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        errors: [{
          message: 'Resource Not Found',
          path: ['updateItem'],
          locations: expect.any(Array),
        }],
        data: {
          updateItem: null
        },
      })
    })
  })

  describe('deleteEntity', () => {
    it('should delete an item', async () => {
      const item = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               deleteItem (input: { _id: "${item._id}" }) {
                 result
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          deleteItem: {
            result: true
          }
        }
      })

      expect(await getDao().findOneById(item._id!)).toBe(null)
    })

    it('should succeed even if the item does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               deleteItem (input: { _id: "${new ObjectId()}" }) {
                 result
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          deleteItem: {
            result: true
          }
        },
      })
    })
  })
})
