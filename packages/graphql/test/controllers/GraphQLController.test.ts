import { Commun, EntityModel } from '@commun/core'
import { GraphQLModule } from '../../src'
import { closeTestApp, getTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { ObjectId } from 'mongodb'

describe('GraphQLController', () => {
  const entityName = 'nodes'
  const collectionName = 'nodes'

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

  describe('getEntity', () => {
    it('should return a single node by id', async () => {
      const node = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `{
               node (_id: "${node._id}") {
                 name
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          node: {
            name: 'test'
          }
        }
      })
    })

    it('should throw an error if the node does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `{
               node (_id: "${new ObjectId()}") {
                 name
               }
             }`
        })
        .expect(500)

      expect(res.body).toEqual({
        errors: [{
          message: 'Resource Not Found',
          path: ['node'],
          locations: expect.any(Array),
        }],
        data: null,
      })
    })
  })

  describe('createEntity', () => {
    it('should create a node', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               createNode (input: { name: "new-entity" }) {
                 node {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          createNode: {
            node: {
              name: 'new-entity'
            }
          }
        }
      })

      expect(await getDao().findOne({ name: 'new-entity' })).toBeDefined()
    })
  })

  describe('updateEntity', () => {
    it('should update a node', async () => {
      const node = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               updateNode (input: { _id: "${node._id}", name: "updated" }) {
                 node {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          updateNode: {
            node: {
              name: 'updated'
            }
          }
        }
      })

      expect((await getDao().findOneById(node._id!))!.name).toEqual('updated')
    })

    it('should throw an error if the node does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               updateNode (input: { _id: "${new ObjectId()}", name: "updated" }) {
                 node {
                   name
                 }
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        errors: [{
          message: 'Resource Not Found',
          path: ['updateNode'],
          locations: expect.any(Array),
        }],
        data: {
          updateNode: null
        },
      })
    })
  })

  describe('deleteEntity', () => {
    it('should delete a node', async () => {
      const node = await getDao().insertOne({ name: 'test' })

      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               deleteNode (input: { _id: "${node._id}" }) {
                 result
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          deleteNode: {
            result: true
          }
        }
      })

      expect(await getDao().findOneById(node._id!)).toBe(null)
    })

    it('should succeed even if the node does not exist', async () => {
      const res = await request()
        .post('/graphql')
        .send({
          query:
            `mutation {
               deleteNode (input: { _id: "${new ObjectId()}" }) {
                 result
               }
             }`
        })
        .expect(200)

      expect(res.body).toEqual({
        data: {
          deleteNode: {
            result: true
          }
        },
      })
    })
  })
})
