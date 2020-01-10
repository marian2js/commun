import { Commun, EntityController, EntityModel, EntityPermission } from '../../src'
import { authenticatedRequest, request } from '../test-helpers/requestHelpers'
import { EntityActionPermissions, ModelAttribute } from '../../src/types'
import { dbHelpers } from '../test-helpers/dbHelpers'
import { ObjectId } from 'mongodb'

describe('EntityController', () => {
  const entityName = 'items'
  const collectionName = 'items'
  const baseUrl = `/api/v1/${entityName}`

  interface TestEntity extends EntityModel {
    name: string
    num?: number
    user?: string
  }

  const registerTestEntity = async (
    permissions: EntityActionPermissions,
    attributes: { [key in keyof TestEntity]: ModelAttribute } = {
      name: {
        type: 'string'
      },
      num: {
        type: 'number'
      },
      user: {
        type: 'user',
        permissions: {
          create: 'system',
          update: 'system'
        }
      },
    }
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

  const registerTestEntityWithCustomAttrPermissions = (
    action: string,
    defaultPermission: EntityPermission,
    nameAttrPermission: EntityPermission
  ) => {
    return registerTestEntity({
      [action]: defaultPermission
    }, {
      num: { type: 'number' },
      name: {
        type: 'string',
        permissions: {
          [action]: nameAttrPermission
        }
      },
      user: {
        type: 'user',
        permissions: {
          create: 'system',
          update: 'system'
        }
      },
    })
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

    describe('Permissions', () => {
      const user1 = new ObjectId().toString()
      const user2 = new ObjectId().toString()

      beforeEach(async () => {
        await getDao().insertOne({ name: 'item1', num: 1, user: user1 })
        await getDao().insertOne({ name: 'item2', num: 2, user: user1 })
        await getDao().insertOne({ name: 'item3', num: 3, user: user2 })
      })

      describe('User', () => {
        it('should only return items if the request is authenticated', async () => {
          await registerTestEntity({ get: 'user' })
          await request().get(baseUrl).expect(401)

          const res = await authenticatedRequest()
            .get(baseUrl)
            .expect(200)
          expect(res.body.items.length).toBe(3)
        })

        it('should only return values with "user" get permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'user')

          const resUnauth = await request().get(baseUrl).expect(200)
          expect(resUnauth.body.items.length).toBe(3)
          expect(resUnauth.body.items[0].name).toBeUndefined()
          expect(resUnauth.body.items[0].num).toBe(1)

          const resAuth = await authenticatedRequest().get(baseUrl).expect(200)
          expect(resAuth.body.items.length).toBe(3)
          expect(resAuth.body.items[0].name).toBe('item1')
          expect(resAuth.body.items[0].num).toBe(1)
        })
      })

      describe('Own', () => {
        it('should only return the resources owned by the user', async () => {
          await registerTestEntity({ get: 'own' })
          const res = await authenticatedRequest(user1)
            .get(baseUrl)
            .expect(200)
          expect(res.body.items.length).toBe(2)
          expect(res.body.items[0].name).toBe('item1')
          expect(res.body.items[1].name).toBe('item2')
        })

        it('should only return values with "own" get permissions if the resource is owned by the user', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'own')

          const resUnauth = await request().get(baseUrl).expect(200)
          expect(resUnauth.body.items.length).toBe(3)
          expect(resUnauth.body.items[0].name).toBeUndefined()
          expect(resUnauth.body.items[0].num).toBe(1)

          const resAuth = await authenticatedRequest(user1).get(baseUrl).expect(200)
          expect(resAuth.body.items.length).toBe(3)
          expect(resAuth.body.items[0].name).toBe('item1')
          expect(resAuth.body.items[0].num).toBe(1)
          expect(resAuth.body.items[2].name).toBeUndefined()
          expect(resAuth.body.items[2].num).toBe(3)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().get(baseUrl).expect(401)
        })

        it('should not return values with "system" get permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'system')
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
    })
  })

  describe('get - [GET] /:entity/:id', () => {
    it('should return a single item', async () => {
      await registerTestEntity({ get: 'anyone' })
      const item = await getDao().insertOne({ name: 'item' })
      const res = await request().get(`${baseUrl}/${item._id}`).expect(200)
      expect(res.body.item.name).toBe('item')
    })

    describe('Permissions', () => {
      let item: TestEntity
      const user = new ObjectId().toString()

      beforeEach(async () => {
        item = await getDao().insertOne({ name: 'item1', num: 1, user })
      })

      describe('User', () => {
        it('should only return items if the request is authenticated', async () => {
          await registerTestEntity({ get: 'user' })
          await request().get(`${baseUrl}/${item._id}`).expect(401)

          await registerTestEntity({ get: 'user' })
          await authenticatedRequest().get(`${baseUrl}/${item._id}`).expect(200)
        })

        it('should only return values with "user" get permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'user')

          const resUnauth = await request().get(`${baseUrl}/${item._id}`).expect(200)
          expect(resUnauth.body.item.name).toBeUndefined()
          expect(resUnauth.body.item.num).toBe(1)

          const resAuth = await authenticatedRequest().get(`${baseUrl}/${item._id}`).expect(200)
          expect(resAuth.body.item.name).toBe('item1')
          expect(resAuth.body.item.num).toBe(1)
        })
      })

      describe('Own', () => {
        it('should only return the resources owned by the user', async () => {
          await registerTestEntity({ get: 'own' })
          await request().get(`${baseUrl}/${item._id}`).expect(401)

          await registerTestEntity({ get: 'own' })
          await authenticatedRequest().get(`${baseUrl}/${item._id}`).expect(401)

          await registerTestEntity({ get: 'own' })
          await authenticatedRequest(user).get(`${baseUrl}/${item._id}`).expect(200)
        })

        it('should only return values with "own" get permissions if the resource is owned by the user', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'own')

          const resUnauth = await request().get(`${baseUrl}/${item._id}`).expect(200)
          expect(resUnauth.body.item.name).toBeUndefined()
          expect(resUnauth.body.item.num).toBe(1)

          const resDifferentUser = await authenticatedRequest().get(`${baseUrl}/${item._id}`).expect(200)
          expect(resDifferentUser.body.item.name).toBeUndefined()
          expect(resDifferentUser.body.item.num).toBe(1)

          const resSameUser = await authenticatedRequest(user).get(`${baseUrl}/${item._id}`).expect(200)
          expect(resSameUser.body.item.name).toBe('item1')
          expect(resSameUser.body.item.num).toBe(1)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().get(`${baseUrl}/${item._id}`).expect(401)
        })

        it('should not return values with "system" get permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'system')

          const res = await request().get(`${baseUrl}/${item._id}`).expect(200)
          expect(res.body.item.name).toBeUndefined()
          expect(res.body.item.num).toBe(1)
        })
      })
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

    it('should set the user attribute with the authenticated user', async () => {
      const user = new ObjectId()
      await registerTestEntity({ get: 'anyone', create: 'anyone' })
      const res = await authenticatedRequest(user.toString()).post(baseUrl)
        .expect(200)
      expect(res.body.item.user).toBe(user.toString())
      const items = await getDao().find({ user })
      expect(items.length).toBe(1)
    })

    describe('Permissions', () => {

      describe('User', () => {
        it('should only create items with "user" create permissions if the request is authenticated', async () => {
          await registerTestEntity({ create: 'user' })
          await request().post(baseUrl)
            .send({ name: 'item' })
            .expect(401)
        })

        it('should only create values with "user" create permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('create', 'anyone', 'user')
          await request().post(baseUrl)
            .send({ name: 'item1', num: 1 })
            .expect(200)
          const item1 = await getDao().findOne({ num: 1 })
          expect(item1!.name).toBeUndefined()

          await authenticatedRequest().post(baseUrl)
            .send({ name: 'item2', num: 2 })
            .expect(200)
          const item2 = await getDao().findOne({ num: 2 })
          expect(item2!.name).toBe('item2')
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().post(baseUrl)
            .send({ name: 'item' })
            .expect(401)
        })

        it('should not create values with "system" create permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('create', 'anyone', 'system')
          await request().post(baseUrl)
            .send({ name: 'item', num: 1 })
            .expect(200)
          const item = await getDao().findOne({ num: 1 })
          expect(item!.name).toBeUndefined()
        })
      })
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

    it('should not update a readonly attribute', async () => {
      const attributes: { [key in keyof TestEntity]: ModelAttribute } = {
        name: {
          type: 'string',
          readonly: true,
        }
      }
      await registerTestEntity({ update: 'anyone' }, attributes)
      const item = await getDao().insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ name: 'This value should not be set' })
        .expect(200)
      const updatedItem = await getDao().findOneById(item._id!)
      expect(updatedItem!.name).toBe('item')
    })

    it('should succeed if a required value is not send on update', async () => {
      const attributes: { [key in keyof TestEntity]: ModelAttribute } = {
        name: {
          type: 'string',
          required: true,
        }
      }
      await registerTestEntity({ update: 'anyone' }, attributes)
      const item = await getDao().insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item._id}`)
        .send({ num: 3 })
        .expect(200)
      const updatedItem = await getDao().findOneById(item._id!)
      expect(updatedItem!.name).toBe('item')
      expect(updatedItem!.num).toBe(3)
    })

    describe('Permissions', () => {
      let item: TestEntity
      const user = new ObjectId().toString()

      beforeEach(async () => {
        item = await getDao().insertOne({ name: 'item', user })
      })

      describe('User', () => {
        it('should only update items with "user" update permissions if the request is authenticated', async () => {
          await registerTestEntity({ update: 'user' })
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(200)
          const updatedItem = await getDao().findOneById(item._id!)
          expect(updatedItem!.name).toBe('updated')
        })

        it('should only update values with "user" update permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'user')
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 10 })
            .expect(200)
          const updatedItem1 = await getDao().findOneById(item._id!)
          expect(updatedItem1!.name).toBe('item')
          expect(updatedItem1!.num).toBe(10)

          await authenticatedRequest().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 20 })
            .expect(200)
          const updatedItem2 = await getDao().findOneById(item._id!)
          expect(updatedItem2!.name).toBe('updated')
          expect(updatedItem2!.num).toBe(20)
        })
      })

      describe('Own', () => {
        it('should only update the resources owned by the user', async () => {
          await registerTestEntity({ update: 'own' })
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest(user).put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(200)
          const updatedItem = await getDao().findOneById(item._id!)
          expect(updatedItem!.name).toBe('updated')
        })

        it('should only update values with "own" update permissions if the resource is owned by the user', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'own')
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 10, user })
            .expect(200)
          const updatedItem1 = await getDao().findOneById(item._id!)
          expect(updatedItem1!.name).toBe('item')
          expect(updatedItem1!.num).toBe(10)

          await authenticatedRequest().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 20, user })
            .expect(200)
          const updatedItem2 = await getDao().findOneById(item._id!)
          expect(updatedItem2!.name).toBe('item')
          expect(updatedItem2!.num).toBe(20)

          await authenticatedRequest(user).put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 30, user })
            .expect(200)
          const updatedItem3 = await getDao().findOneById(item._id!)
          expect(updatedItem3!.name).toBe('updated')
          expect(updatedItem3!.num).toBe(30)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated' })
            .expect(401)
        })

        it('should not update values with "system" update permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'system')
          await request().put(`${baseUrl}/${item._id}`)
            .send({ name: 'updated', num: 10 })
            .expect(200)
          const updatedItem = await getDao().findOneById(item._id!)
          expect(updatedItem!.name).toBe('item')
          expect(updatedItem!.num).toBe(10)
        })
      })
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

    describe('Permissions', () => {
      let item: TestEntity
      const user = new ObjectId().toString()

      beforeEach(async () => {
        item = await getDao().insertOne({ name: 'item', user })
      })

      describe('User', () => {
        it('should only delete an item with "user" delete permission if the request is authenticated', async () => {
          await registerTestEntity({ delete: 'user' })
          await request().delete(`${baseUrl}/${item._id}`)
            .expect(401)
          await authenticatedRequest().delete(`${baseUrl}/${item._id}`)
            .expect(200)
        })
      })

      describe('Own', () => {
        it('should only delete an item with "own" delete permission if the resource is owned by the user', async () => {
          await registerTestEntity({ delete: 'own' })
          await request().delete(`${baseUrl}/${item._id}`)
            .expect(401)
          await authenticatedRequest().delete(`${baseUrl}/${item._id}`)
            .expect(401)
          await authenticatedRequest(user).delete(`${baseUrl}/${item._id}`)
            .expect(200)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().delete(`${baseUrl}/${item._id}`)
            .expect(401)
          await authenticatedRequest().delete(`${baseUrl}/${item._id}`)
            .expect(401)
        })
      })
    })
  })
})
