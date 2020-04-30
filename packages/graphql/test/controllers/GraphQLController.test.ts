import { Commun, ConfigManager, EntityModel } from '@commun/core'
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
    GraphQLModule._writeFile = jest.fn(() => Promise.resolve())
    ConfigManager.setRootPath('/test-project/lib')
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

    describe('First', () => {
      beforeEach(async () => {
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}` })
        }
      })

      it('should limit the number of items returned', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 4) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)
        expect(res.body.data.items.nodes.length).toBe(4)

        const res2 = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 40) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)
        expect(res2.body.data.items.nodes.length).toBe(10)
      })
    })

    describe('Last', () => {
      beforeEach(async () => {
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}` })
        }
      })

      it('should skip the given number of items', async () => {
        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (last: 4) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)
        expect(res.body.data.items.nodes.length).toBe(6)

        const res2 = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (last: 40) {
                 nodes {
                   name
                 }
               }
             }`
          })
          .expect(200)
        expect(res2.body.data.items.nodes.length).toBe(0)
      })
    })

    describe('Cursor Pagination', () => {
      beforeEach(async () => {
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}` })
        }
      })

      it('should paginate using endCursor', async () => {
        const page1 = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 4) {
                 nodes {
                   name
                 }
                 pageInfo {
                   endCursor
                   hasPreviousPage
                   hasNextPage
                 }
               }
             }`
          })
          .expect(200)
        expect(page1.body.data.items.nodes.length).toBe(4)
        expect(page1.body.data.items.nodes[0].name).toBe('item-0')
        expect(page1.body.data.items.nodes[1].name).toBe('item-1')
        expect(page1.body.data.items.nodes[2].name).toBe('item-2')
        expect(page1.body.data.items.nodes[3].name).toBe('item-3')
        expect(page1.body.data.items.pageInfo.hasPreviousPage).toBe(false)
        expect(page1.body.data.items.pageInfo.hasNextPage).toBe(true)

        const page2 = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 4, after: "${page1.body.data.items.pageInfo.endCursor}") {
                 nodes {
                   name
                 }
                 pageInfo {
                   endCursor
                   hasPreviousPage
                   hasNextPage
                 }
               }
             }`
          })
          .expect(200)
        expect(page2.body.data.items.nodes.length).toBe(4)
        expect(page2.body.data.items.nodes[0].name).toBe('item-4')
        expect(page2.body.data.items.nodes[1].name).toBe('item-5')
        expect(page2.body.data.items.nodes[2].name).toBe('item-6')
        expect(page2.body.data.items.nodes[3].name).toBe('item-7')
        expect(page2.body.data.items.pageInfo.hasPreviousPage).toBe(true)
        expect(page2.body.data.items.pageInfo.hasNextPage).toBe(true)

        const page3 = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 4, after: "${page2.body.data.items.pageInfo.endCursor}") {
                 nodes {
                   name
                 }
                 pageInfo {
                   endCursor
                   hasPreviousPage
                   hasNextPage
                 }
               }
             }`
          })
          .expect(200)
        expect(page3.body.data.items.nodes.length).toBe(2)
        expect(page3.body.data.items.nodes[0].name).toBe('item-8')
        expect(page3.body.data.items.nodes[1].name).toBe('item-9')
        expect(page3.body.data.items.pageInfo.hasPreviousPage).toBe(true)
        expect(page3.body.data.items.pageInfo.hasNextPage).toBe(false)
      })
    })

    describe('Total Count', () => {
      it('should return the total count of items', async () => {
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item${i}` })
        }

        const res = await request()
          .post('/graphql')
          .send({
            query:
              `{
               items (first: 3) {
                 nodes {
                   name
                 }
                 totalCount
               }
             }`
          })
          .expect(200)

        expect(res.body).toEqual({
          data: {
            items: {
              nodes: [{
                name: 'item0'
              }, {
                name: 'item1'
              }, {
                name: 'item2'
              }],
              totalCount: 10
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
               item (id: "${node.id}") {
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
               item (id: "${new ObjectId()}") {
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
               updateItem (input: { id: "${item.id}", name: "updated" }) {
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

      expect((await getDao().findOneById(item.id!))!.name).toEqual('updated')
    })

    it('should throw an error if the item does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               updateItem (input: { id: "${new ObjectId()}", name: "updated" }) {
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
               deleteItem (input: { id: "${item.id}" }) {
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

      expect(await getDao().findOneById(item.id!)).toBe(null)
    })

    it('should succeed even if the item does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               deleteItem (input: { id: "${new ObjectId()}" }) {
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
