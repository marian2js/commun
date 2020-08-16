import { Commun, EntityController, EntityIndex, EntityModel, EntityPermission } from '../../src'
import { EntityActionPermissions, JoinProperty } from '../../src/types'
import { ObjectId } from 'mongodb'
import { entityHooks } from '../../src/entity/entityHooks'
import { authenticatedRequest, closeTestApp, request, startTestApp, stopTestApp } from '@commun/test-utils'
import { JSONSchema7 } from 'json-schema'

type AdminUser = EntityModel & { admin: boolean }

describe('EntityController', () => {
  const entityName = 'items'
  const collectionName = 'items'
  const baseUrl = `/api/v1/${entityName}`
  let admin: AdminUser

  interface TestEntity extends EntityModel {
    name: string
    num?: number
    user?: string | ObjectId
    entityRef?: string | ObjectId
    eval?: string
    slug?: string
  }

  const registerTestEntity = async (
    permissions: EntityActionPermissions,
    properties?: JSONSchema7['properties'] | null,
    joinProperties: { [key: string]: JoinProperty } = {},
    indexes: EntityIndex<TestEntity>[] = []
  ) => {
    Commun.registerEntity<TestEntity>({
      config: {
        entityName,
        collectionName,
        permissions: {
          ...permissions,
          properties: {
            user: {
              create: 'system',
              update: 'system',
            },
            ...(permissions.properties || {}),
          },
        },
        schema: {
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            num: {
              type: 'number'
            },
            user: {
              $ref: '#user',
            },
            entityRef: {
              $ref: '#entity/item',
            },
            eval: {
              format: 'eval:Name => {this.name}',
            },
            slug: {
              format: 'eval:{slug(this.name)}-{randomChars(8)}',
            },
            ...(properties || {})
          },
        },
        joinProperties,
        indexes,
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
      properties: {
        name: {
          [action]: nameAttrPermission
        },
        user: {
          create: 'system',
          update: 'system',
        }
      },
      [action]: defaultPermission
    }, {
      num: { type: 'number' },
      name: {
        type: 'string',
      },
      user: {
        $ref: '#user',
      },
    })
  }

  const getDao = () => Commun.getEntityDao<TestEntity>(entityName)

  const registerNewUser = async (userId = new ObjectId()) => {
    return await Commun.getEntityDao<EntityModel & { username: string, email: string }>('users')
      .insertOne({ id: userId.toString(), username: `user${userId}`, email: `${userId}@example.org` })
  }

  beforeAll(async () => {
    Commun.registerEntity<AdminUser>({
      config: {
        entityName: 'users',
        collectionName: 'users',
        schema: {
          properties: {
            admin: {
              type: 'boolean'
            }
          }
        }
      }
    })
    await startTestApp(Commun)
    admin = await Commun.getEntityDao<AdminUser>('users')
      .insertOne({ admin: true })
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

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

    describe('Sorting', () => {
      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' })
        await getDao().insertOne({ name: 'first item' })
        await getDao().insertOne({ name: 'second item' })
        await getDao().insertOne({ name: 'last item' })
      })

      it('should return items sorted by creation time', async () => {
        const res = await request().get(`${baseUrl}?orderBy=createdAt:asc`).expect(200)
        expect(res.body.items[0].name).toBe('first item')
        expect(res.body.items[1].name).toBe('second item')
        expect(res.body.items[2].name).toBe('last item')

        const res2 = await request().get(`${baseUrl}?orderBy=createdAt:desc`).expect(200)
        expect(res2.body.items[0].name).toBe('last item')
        expect(res2.body.items[1].name).toBe('second item')
        expect(res2.body.items[2].name).toBe('first item')
      })

      it('should return items sorted by name', async () => {
        const res = await request().get(`${baseUrl}?orderBy=name:asc`).expect(200)
        expect(res.body.items[0].name).toBe('first item')
        expect(res.body.items[1].name).toBe('last item')
        expect(res.body.items[2].name).toBe('second item')

        const res2 = await request().get(`${baseUrl}?orderBy=name:desc`).expect(200)
        expect(res2.body.items[0].name).toBe('second item')
        expect(res2.body.items[1].name).toBe('last item')
        expect(res2.body.items[2].name).toBe('first item')
      })
    })

    describe('Filters', () => {
      let user1: ObjectId
      let user2: ObjectId

      beforeEach(async () => {
        user1 = new ObjectId((await registerNewUser()).id!)
        user2 = new ObjectId((await registerNewUser()).id!)
        await registerTestEntity({ get: 'anyone' })
        await getDao().insertOne({ name: 'item1', num: 20, user: user1 })
        await getDao().insertOne({ name: 'item2', num: 8, user: user1 })
        await getDao().insertOne({ name: 'item3', num: 20, user: user2 })
        await getDao().insertOne({ name: 'item4', num: 12, user: user2 })
      })

      it('should filter items by name', async () => {
        const res = await request().get(`${baseUrl}?filter=name:item1`).expect(200)
        expect(res.body.items.length).toBe(1)
        expect(res.body.items[0].name).toBe('item1')
      })

      it('should filter items by a numeric property', async () => {
        const res = await request().get(`${baseUrl}?filter=num:20`).expect(200)
        expect(res.body.items.length).toBe(2)
        expect(res.body.items[0].name).toBe('item1')
        expect(res.body.items[1].name).toBe('item3')
      })

      it('should filter items by user ID', async () => {
        const res = await request().get(`${baseUrl}?filter=user:${user1}`).expect(200)
        expect(res.body.items.length).toBe(2)
        expect(res.body.items[0].name).toBe('item1')
        expect(res.body.items[1].name).toBe('item2')
      })

      it('should filter items by multiple properties', async () => {
        const res = await request().get(`${baseUrl}?filter=num:20;user:${user1}`).expect(200)
        expect(res.body.items.length).toBe(1)
        expect(res.body.items[0].name).toBe('item1')
      })
    })

    describe('First', () => {
      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' })
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}` })
        }
      })

      it('should return limit the number of items returned', async () => {
        const res = await request().get(`${baseUrl}?first=4`).expect(200)
        expect(res.body.items.length).toBe(4)

        const res2 = await request().get(`${baseUrl}?first=30`).expect(200)
        expect(res2.body.items.length).toBe(10)
      })
    })

    describe('Last', () => {
      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' })
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}` })
        }
      })

      it('should skip the given number of items', async () => {
        const res = await request().get(`${baseUrl}?last=4`).expect(200)
        expect(res.body.items.length).toBe(6)
        expect(res.body.items[0].name).toBe('item-4')

        const res2 = await request().get(`${baseUrl}?last=30`).expect(200)
        expect(res2.body.items.length).toBe(0)
      })
    })

    describe('Cursor Pagination', () => {
      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' })
        for (let i = 0; i < 10; i++) {
          await getDao().insertOne({ name: `item-${i}`, num: i % 2 === 0 ? 1 : 0 })
        }
      })

      it('should support a cursor for pagination', async () => {
        const page1 = await request().get(`${baseUrl}?first=4`)
          .expect(200)
        expect(page1.body.items.length).toBe(4)
        expect(page1.body.items[0].name).toBe('item-0')
        expect(page1.body.items[1].name).toBe('item-1')
        expect(page1.body.items[2].name).toBe('item-2')
        expect(page1.body.items[3].name).toBe('item-3')
        expect(page1.body.pageInfo.hasPreviousPage).toBe(false)
        expect(page1.body.pageInfo.hasNextPage).toBe(true)

        const page2 = await request().get(`${baseUrl}?first=4&after=${page1.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page2.body.items.length).toBe(4)
        expect(page2.body.items[0].name).toBe('item-4')
        expect(page2.body.items[1].name).toBe('item-5')
        expect(page2.body.items[2].name).toBe('item-6')
        expect(page2.body.items[3].name).toBe('item-7')
        expect(page2.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page2.body.pageInfo.hasNextPage).toBe(true)

        const page3 = await request().get(`${baseUrl}?first=4&after=${page2.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page3.body.items.length).toBe(2)
        expect(page3.body.items[0].name).toBe('item-8')
        expect(page3.body.items[1].name).toBe('item-9')
        expect(page3.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page3.body.pageInfo.hasNextPage).toBe(false)

        const page4 = await request().get(`${baseUrl}?first=4&after=${page3.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page4.body.items.length).toBe(0)
        expect(page4.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page4.body.pageInfo.hasNextPage).toBe(false)
      })

      it('should support a cursor for pagination on a sorted query', async () => {
        const page1 = await request().get(`${baseUrl}?first=4&orderBy=num:DESC`)
          .expect(200)
        expect(page1.body.items.length).toBe(4)
        expect(page1.body.items[0].name).toBe('item-0')
        expect(page1.body.items[1].name).toBe('item-2')
        expect(page1.body.items[2].name).toBe('item-4')
        expect(page1.body.items[3].name).toBe('item-6')
        expect(page1.body.pageInfo.hasPreviousPage).toBe(false)
        expect(page1.body.pageInfo.hasNextPage).toBe(true)

        const page2 = await request().get(`${baseUrl}?first=4&orderBy=num:DESC&after=${page1.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page2.body.items.length).toBe(4)
        expect(page2.body.items[0].name).toBe('item-8')
        expect(page2.body.items[1].name).toBe('item-1')
        expect(page2.body.items[2].name).toBe('item-3')
        expect(page2.body.items[3].name).toBe('item-5')
        expect(page2.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page2.body.pageInfo.hasNextPage).toBe(true)

        const page3 = await request().get(`${baseUrl}?first=4&orderBy=num:DESC&after=${page2.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page3.body.items.length).toBe(2)
        expect(page3.body.items[0].name).toBe('item-7')
        expect(page3.body.items[1].name).toBe('item-9')
        expect(page3.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page3.body.pageInfo.hasNextPage).toBe(false)

        const page4 = await request().get(`${baseUrl}?first=4&orderBy=num:DESC&after=${page3.body.pageInfo.endCursor}`)
          .expect(200)
        expect(page4.body.items.length).toBe(0)
        expect(page4.body.pageInfo.hasPreviousPage).toBe(true)
        expect(page4.body.pageInfo.hasNextPage).toBe(false)
      })

      it('should support a before cursor for pagination', async () => {
        const res = await request().get(`${baseUrl}?last=7`)

        const page1 = await request().get(`${baseUrl}?before=${res.body.pageInfo.startCursor}`)
          .expect(200)
        expect(page1.body.items.length).toBe(7)
        expect(page1.body.items[0].name).toBe('item-0')
        expect(page1.body.items[1].name).toBe('item-1')
        expect(page1.body.items[2].name).toBe('item-2')
        expect(page1.body.items[3].name).toBe('item-3')
        expect(page1.body.items[4].name).toBe('item-4')
        expect(page1.body.items[5].name).toBe('item-5')
        expect(page1.body.items[6].name).toBe('item-6')
        expect(page1.body.pageInfo.hasPreviousPage).toBe(false)
        expect(page1.body.pageInfo.hasNextPage).toBe(false)
      })
    })

    describe('Search', () => {
      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' }, null, {}, [{
          keys: {
            name: 'text'
          }
        }])
        await getDao().insertOne({ name: `apple banana orange` })
        await getDao().insertOne({ name: `mango orange avocado` })
        await getDao().insertOne({ name: `blueberries lemon apple` })
      })

      it('should return limit the number of items returned', async () => {
        const res = await request().get(`${baseUrl}?search=apple`).expect(200)
        expect(res.body.items.length).toBe(2)
        expect(res.body.items[0].name).toContain('apple')
        expect(res.body.items[1].name).toContain('apple')

        const res2 = await request().get(`${baseUrl}?search=orange`).expect(200)
        expect(res2.body.items.length).toBe(2)
        expect(res2.body.items[0].name).toContain('orange')
        expect(res2.body.items[1].name).toContain('orange')

        const res3 = await request().get(`${baseUrl}?search=truck`).expect(200)
        expect(res3.body.items.length).toBe(0)
      })
    })

    describe('Populate', () => {
      let item1: TestEntity
      let item2: TestEntity
      let item3: TestEntity

      beforeEach(async () => {
        await registerTestEntity({ get: 'anyone' })
        item1 = await getDao().insertOne({ name: 'item1' })
        item2 = await getDao().insertOne({ name: 'item2', entityRef: item1.id })
        item3 = await getDao().insertOne({ name: 'item3', entityRef: item2.id })
      })

      it('should populate a ref property', async () => {
        const res = await request().get(`${baseUrl}?populate=entityRef`).expect(200)
        expect(res.body.items[0].entityRef).toBeUndefined()
        expect(res.body.items[1].entityRef).toEqual({ id: item1.id, name: 'item1', createdAt: expect.any(String) })
        expect(res.body.items[2].entityRef).toEqual({
          id: item2.id,
          name: 'item2',
          entityRef: { id: item1.id },
          createdAt: expect.any(String)
        })
      })
    })

    describe('Permissions', () => {
      let user1: string
      let user2: string

      beforeEach(async () => {
        user1 = (await registerNewUser()).id!
        user2 = (await registerNewUser()).id!
        await getDao().insertOne({ name: 'item1', num: 1, user: user1 })
        await getDao().insertOne({ name: 'item2', num: 2, user: user1 })
        await getDao().insertOne({ name: 'item3', num: 3, user: user2 })
      })

      describe('User', () => {
        it('should only return items if the request is authenticated', async () => {
          await registerTestEntity({ get: 'user' })
          await request().get(baseUrl).expect(401)

          const res = await authenticatedRequest(user1)
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

          const resAuth = await authenticatedRequest(user1).get(baseUrl).expect(200)
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

      describe('Admin', () => {
        it('should only return items if the user is an admin', async () => {
          await registerTestEntity({ get: 'admin' })
          await request().get(baseUrl).expect(401)

          const res = await authenticatedRequest(admin.id)
            .get(baseUrl)
            .expect(200)
          expect(res.body.items.length).toBe(3)
        })

        it('should return items with "own" get permission if the user is an admin', async () => {
          await registerTestEntity({ get: 'own' })
          const res = await request().get(baseUrl).expect(200)
          expect(res.body.items.length).toBe(0)

          const resNonAdmin = await authenticatedRequest(admin.id)
            .get(baseUrl)
            .expect(200)
          expect(resNonAdmin.body.items.length).toBe(3)
        })

        it('should only return values with "admin" get permissions if the user is an admin', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'admin')

          const resNonAdmin = await request().get(baseUrl).expect(200)
          expect(resNonAdmin.body.items.length).toBe(3)
          expect(resNonAdmin.body.items[0].name).toBeUndefined()
          expect(resNonAdmin.body.items[0].num).toBe(1)

          const resAdmin = await authenticatedRequest(admin.id).get(baseUrl).expect(200)
          expect(resAdmin.body.items.length).toBe(3)
          expect(resAdmin.body.items[0].name).toBe('item1')
          expect(resAdmin.body.items[0].num).toBe(1)
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
      const res = await request().get(`${baseUrl}/${item.id}`).expect(200)
      expect(res.body.item.name).toBe('item')
    })

    it('should return the default value if no value is given', async () => {
      await registerTestEntity({ get: 'anyone' }, { name: { type: 'string', default: 'default-name' } })
      const item = await getDao().insertOne({ name: 'item' })
      const res = await request().get(`${baseUrl}/${item.id}`).expect(200)
      expect(res.body.item.name).toBe('item')

      const item2 = await getDao().insertOne({ name: null! })
      const res2 = await request().get(`${baseUrl}/${item2.id}`).expect(200)
      expect(res2.body.item.name).toBe('default-name')
    })

    describe('Hooks', () => {
      it('should call beforeGet and afterGet', async () => {
        spyOn(entityHooks, 'run')
        await registerTestEntity({ get: 'anyone' })
        const item = await getDao().insertOne({ name: 'item' })
        await request().get(`${baseUrl}/${item.id}`).expect(200)
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'beforeGet', item, expect.any(Object))
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'afterGet', item, expect.any(Object))
      })
    })

    describe('Join Properties', () => {
      it('should return join properties', async () => {
        await registerTestEntity({
          get: 'anyone',
          properties: {
            num: { get: 'system' },
          }
        }, {
          name: {
            type: 'string'
          },
          num: {
            type: 'number',
          },
          entityRef: {
            $ref: '#entity/item',
          }
        }, {
          single: {
            type: 'findOne',
            entity: entityName,
            query: {
              name: '{this.entityRef.name}'
            }
          },
          multiple: {
            type: 'findMany',
            entity: entityName,
            query: {
              name: '{this.entityRef.name}'
            }
          }
        })
        const target1 = await getDao().insertOne({ name: 'target-item', num: 1 })
        const target2 = await getDao().insertOne({ name: 'target-item', num: 2 })
        const item = await getDao().insertOne({ name: 'item', entityRef: new ObjectId(target1.id) })
        const res = await request().get(`${baseUrl}/${item.id}`).expect(200)
        expect(res.body.item.single.id).toBe(target1.id)
        expect(res.body.item.single.name).toBe('target-item')
        expect(res.body.item.single.num).toBeUndefined()
        expect(res.body.item.multiple[0].id).toBe(target1.id)
        expect(res.body.item.multiple[0].name).toBe('target-item')
        expect(res.body.item.multiple[0].num).toBeUndefined()
        expect(res.body.item.multiple[1].id).toBe(target2.id)
        expect(res.body.item.multiple[1].name).toBe('target-item')
        expect(res.body.item.multiple[1].num).toBeUndefined()
      })
    })

    describe('Permissions', () => {
      let item: TestEntity
      let user: string

      beforeEach(async () => {
        user = (await registerNewUser()).id!
        item = await getDao().insertOne({ name: 'item1', num: 1, user })
      })

      describe('User', () => {
        it('should only return items if the request is authenticated', async () => {
          await registerTestEntity({ get: 'user' })
          await request().get(`${baseUrl}/${item.id}`).expect(401)

          await registerTestEntity({ get: 'user' })
          await authenticatedRequest(user).get(`${baseUrl}/${item.id}`).expect(200)
        })

        it('should only return values with "user" get permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'user')

          const resUnauth = await request().get(`${baseUrl}/${item.id}`).expect(200)
          expect(resUnauth.body.item.name).toBeUndefined()
          expect(resUnauth.body.item.num).toBe(1)

          const resAuth = await authenticatedRequest(user).get(`${baseUrl}/${item.id}`).expect(200)
          expect(resAuth.body.item.name).toBe('item1')
          expect(resAuth.body.item.num).toBe(1)
        })
      })

      describe('Own', () => {
        it('should only return the resources owned by the user', async () => {
          await registerTestEntity({ get: 'own' })
          await request().get(`${baseUrl}/${item.id}`).expect(401)

          await registerTestEntity({ get: 'own' })
          await authenticatedRequest().get(`${baseUrl}/${item.id}`).expect(401)

          await registerTestEntity({ get: 'own' })
          await authenticatedRequest(user).get(`${baseUrl}/${item.id}`).expect(200)
        })

        it('should only return values with "own" get permissions if the resource is owned by the user', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'own')

          const resUnauth = await request().get(`${baseUrl}/${item.id}`).expect(200)
          expect(resUnauth.body.item.name).toBeUndefined()
          expect(resUnauth.body.item.num).toBe(1)

          const resDifferentUser = await authenticatedRequest().get(`${baseUrl}/${item.id}`).expect(200)
          expect(resDifferentUser.body.item.name).toBeUndefined()
          expect(resDifferentUser.body.item.num).toBe(1)

          const resSameUser = await authenticatedRequest(user).get(`${baseUrl}/${item.id}`).expect(200)
          expect(resSameUser.body.item.name).toBe('item1')
          expect(resSameUser.body.item.num).toBe(1)
        })
      })

      describe('Admin', () => {
        it('should only return the resources if the user is an admin', async () => {
          await registerTestEntity({ get: 'admin' })
          await request().get(`${baseUrl}/${item.id}`).expect(401)

          await registerTestEntity({ get: 'admin' })
          await authenticatedRequest().get(`${baseUrl}/${item.id}`).expect(401)

          await registerTestEntity({ get: 'admin' })
          await authenticatedRequest(admin.id).get(`${baseUrl}/${item.id}`).expect(200)
        })

        it('should only return values with "admin" get permissions if the user is an admin', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'admin')

          const resUnauth = await request().get(`${baseUrl}/${item.id}`).expect(200)
          expect(resUnauth.body.item.name).toBeUndefined()
          expect(resUnauth.body.item.num).toBe(1)

          const resNonAdmin = await authenticatedRequest().get(`${baseUrl}/${item.id}`).expect(200)
          expect(resNonAdmin.body.item.name).toBeUndefined()
          expect(resNonAdmin.body.item.num).toBe(1)

          const resAdmin = await authenticatedRequest(admin.id).get(`${baseUrl}/${item.id}`).expect(200)
          expect(resAdmin.body.item.name).toBe('item1')
          expect(resAdmin.body.item.num).toBe(1)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().get(`${baseUrl}/${item.id}`).expect(401)
        })

        it('should not return values with "system" get permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('get', 'anyone', 'system')

          const res = await request().get(`${baseUrl}/${item.id}`).expect(200)
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

    it('should set default item values', async () => {
      await registerTestEntity({ get: 'anyone', create: 'anyone' }, {
        name: {
          type: 'string',
          default: 'default-name'
        }
      })
      const res = await request().post(baseUrl)
        .send({})
        .expect(200)
      expect(res.body.item.name).toBe('default-name')
      const item = await getDao().findOne({ name: 'default-name' })
      expect(item!.name).toBe('default-name')
    })

    it('should return an error if the name is unique and already exists', async () => {
      const properties: JSONSchema7['properties'] = {
        name: {
          type: 'string',
        }
      }
      const indexes: EntityIndex<TestEntity>[] = [{
        keys: {
          name: 1
        },
        unique: true,
      }]
      await registerTestEntity({ create: 'anyone' }, properties, {}, indexes)
      await getDao().insertOne({ name: 'item' })
      await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(400)
    })

    it('should set the user property with the authenticated user', async () => {
      const user = new ObjectId()
      await registerTestEntity({ get: 'anyone', create: 'anyone' })
      const res = await authenticatedRequest(user.toString()).post(baseUrl)
        .send({ name: 'item' })
        .expect(200)
      expect(res.body.item.user).toEqual({ id: user.toString() })
      const items = await getDao().find({ user })
      expect(items.length).toBe(1)
    })

    it('should set the eval property from the entity name', async () => {
      await registerTestEntity({ get: 'anyone', create: 'anyone' })
      const res = await request().post(baseUrl)
        .send({ name: 'item' })
        .expect(200)
      expect(res.body.item.name).toBe('item')
      expect(res.body.item.eval).toBe('Name => item')
      const item = await getDao().findOne({ name: 'item' })
      expect(item!.name).toBe('item')
    })

    it('should set the slug property from the entity name', async () => {
      await registerTestEntity({ get: 'anyone', create: 'anyone' })
      const res = await request().post(baseUrl)
        .send({ name: 'Test Item' })
        .expect(200)
      expect(res.body.item.name).toBe('Test Item')
      expect(res.body.item.slug.substr(0, 10)).toBe('test-item-')
      expect(res.body.item.slug.length).toBe(18)
      const item = await getDao().findOne({ name: 'Test Item' })
      expect(item!.name).toBe('Test Item')
    })

    describe('Hooks', () => {
      it('should call beforeCreate and afterCreate', async () => {
        spyOn(entityHooks, 'run')
        await registerTestEntity({ get: 'anyone', create: 'anyone' })
        await request().post(baseUrl)
          .send({ name: 'item' })
          .expect(200)
        const item = await getDao().findOne({ name: 'item' })
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'beforeCreate', expect.objectContaining({
          name: 'item'
        }), expect.any(Object))
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'afterCreate', expect.objectContaining({
          id: item!.id!.toString(),
          name: 'item'
        }), expect.any(Object))
      })
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
          const user = await registerNewUser()
          await request().post(baseUrl)
            .send({ name: 'item1', num: 1 })
            .expect(200)
          const item1 = await getDao().findOne({ num: 1 })
          expect(item1!.name).toBeUndefined()

          await authenticatedRequest(user.id).post(baseUrl)
            .send({ name: 'item2', num: 2 })
            .expect(200)
          const item2 = await getDao().findOne({ num: 2 })
          expect(item2!.name).toBe('item2')
        })
      })

      describe('Admin', () => {
        it('should only create items with "admin" create permissions if the user is an admin', async () => {
          await registerTestEntity({ create: 'admin' })
          await request().post(baseUrl)
            .send({ name: 'item' })
            .expect(401)

          await authenticatedRequest().post(baseUrl)
            .send({ name: 'item' })
            .expect(401)

          await authenticatedRequest(admin.id).post(baseUrl)
            .send({ name: 'item' })
            .expect(200)
        })

        it('should only create values with "admin" create permissions if the user is an admin', async () => {
          await registerTestEntityWithCustomAttrPermissions('create', 'anyone', 'admin')
          await request().post(baseUrl)
            .send({ name: 'item1', num: 1 })
            .expect(200)
          const item1 = await getDao().findOne({ num: 1 })
          expect(item1!.name).toBeUndefined()

          await authenticatedRequest().post(baseUrl)
            .send({ name: 'item2', num: 2 })
            .expect(200)
          const item2 = await getDao().findOne({ num: 2 })
          expect(item2!.name).toBeUndefined()

          await authenticatedRequest(admin.id).post(baseUrl)
            .send({ name: 'item3', num: 3 })
            .expect(200)
          const item3 = await getDao().findOne({ num: 3 })
          expect(item3!.name).toBe('item3')
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
    it('should update an item and return it', async () => {
      await registerTestEntity({ get: 'anyone', update: 'anyone' })
      const item = await getDao().insertOne({ name: 'item' })
      const res = await request().put(`${baseUrl}/${item.id}`)
        .send({ name: 'updated' })
        .expect(200)
      const updatedItem = await getDao().findOneById(item.id!)
      expect(updatedItem!.name).toBe('updated')
      expect(res.body.item.name).toBe('updated')
    })

    it('should return an error if the name is unique and already exists', async () => {
      const properties: JSONSchema7['properties'] = {
        name: {
          type: 'string',
        }
      }
      const indexes: EntityIndex<TestEntity>[] = [{
        keys: {
          name: 1
        },
        unique: true,
      }]
      await registerTestEntity({ update: 'anyone' }, properties, {}, indexes)
      await getDao().insertOne({ name: 'item1' })
      const item = await getDao().insertOne({ name: 'item2' })
      await request().put(`${baseUrl}/${item.id}`)
        .send({ name: 'item1' })
        .expect(400)
    })

    it('should not update a readonly property', async () => {
      const properties: JSONSchema7['properties'] = {
        name: {
          type: 'string',
          readOnly: true,
        }
      }
      await registerTestEntity({ update: 'anyone' }, properties)
      const item = await getDao().insertOne({ name: 'item' })
      await request().put(`${baseUrl}/${item.id}`)
        .send({ name: 'This value should not be set' })
        .expect(200)
      const updatedItem = await getDao().findOneById(item.id!)
      expect(updatedItem!.name).toBe('item')
    })

    it('should succeed if a required value is not send on update', async () => {
      const properties: JSONSchema7['properties'] = {
        num: {
          type: 'number'
        },
        name: {
          type: 'string',
        }
      }
      await registerTestEntity({ update: 'anyone' }, properties)
      const item = await getDao().insertOne({ name: 'item' })
      const res = await request().put(`${baseUrl}/${item.id}`)
        .send({ num: 3 })
        .expect(200)
      console.log('BODY ===>', res.body)
      const updatedItem = await getDao().findOneById(item.id!)
      expect(updatedItem!.name).toBe('item')
      expect(updatedItem!.num).toBe(3)
    })

    describe('Hooks', () => {
      it('should call beforeUpdate and afterUpdate', async () => {
        spyOn(entityHooks, 'run')
        await registerTestEntity({ get: 'anyone', update: 'anyone' })
        const item = await getDao().insertOne({ name: 'item' })
        await request().put(`${baseUrl}/${item.id}`)
          .send({ name: 'updated' })
          .expect(200)
        const updatedItem = await getDao().findOneById(item.id!)
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'beforeUpdate', item, expect.any(Object))
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'afterUpdate', updatedItem, expect.any(Object))
      })
    })

    describe('Permissions', () => {
      let item: TestEntity
      let user: string

      beforeEach(async () => {
        user = (await registerNewUser()).id!
        item = await getDao().insertOne({ name: 'item', user })
      })

      describe('User', () => {
        it('should only update items with "user" update permissions if the request is authenticated', async () => {
          await registerTestEntity({ update: 'user' })
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest(user).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(200)
          const updatedItem = await getDao().findOneById(item.id!)
          expect(updatedItem!.name).toBe('updated')
        })

        it('should only update values with "user" update permissions if the request is authenticated', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'user')
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 10 })
            .expect(200)
          const updatedItem1 = await getDao().findOneById(item.id!)
          expect(updatedItem1!.name).toBe('item')
          expect(updatedItem1!.num).toBe(10)

          await authenticatedRequest(user).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 20 })
            .expect(200)
          const updatedItem2 = await getDao().findOneById(item.id!)
          expect(updatedItem2!.name).toBe('updated')
          expect(updatedItem2!.num).toBe(20)
        })
      })

      describe('Own', () => {
        it('should only update the resources owned by the user', async () => {
          await registerTestEntity({ update: 'own' })
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest(user).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(200)
          const updatedItem = await getDao().findOneById(item.id!)
          expect(updatedItem!.name).toBe('updated')
        })

        it('should only update values with "own" update permissions if the resource is owned by the user', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'own')
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 10, user })
            .expect(200)
          const updatedItem1 = await getDao().findOneById(item.id!)
          expect(updatedItem1!.name).toBe('item')
          expect(updatedItem1!.num).toBe(10)

          await authenticatedRequest().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 20, user })
            .expect(200)
          const updatedItem2 = await getDao().findOneById(item.id!)
          expect(updatedItem2!.name).toBe('item')
          expect(updatedItem2!.num).toBe(20)

          await authenticatedRequest(user).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 30, user })
            .expect(200)
          const updatedItem3 = await getDao().findOneById(item.id!)
          expect(updatedItem3!.name).toBe('updated')
          expect(updatedItem3!.num).toBe(30)
        })
      })

      describe('Admin', () => {
        it('should only update the resources if the user is an admin', async () => {
          await registerTestEntity({ update: 'admin' })
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest(admin.id).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(200)
          const updatedItem = await getDao().findOneById(item.id!)
          expect(updatedItem!.name).toBe('updated')
        })

        it('should only update values with "admin" update permissions if the user is an admin', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'admin')
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 10, user })
            .expect(200)
          const updatedItem1 = await getDao().findOneById(item.id!)
          expect(updatedItem1!.name).toBe('item')
          expect(updatedItem1!.num).toBe(10)

          await authenticatedRequest().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 20, user })
            .expect(200)
          const updatedItem2 = await getDao().findOneById(item.id!)
          expect(updatedItem2!.name).toBe('item')
          expect(updatedItem2!.num).toBe(20)

          await authenticatedRequest(admin.id).put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 30, user })
            .expect(200)
          const updatedItem3 = await getDao().findOneById(item.id!)
          expect(updatedItem3!.name).toBe('updated')
          expect(updatedItem3!.num).toBe(30)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)

          await authenticatedRequest().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated' })
            .expect(401)
        })

        it('should not update values with "system" update permissions', async () => {
          await registerTestEntityWithCustomAttrPermissions('update', 'anyone', 'system')
          await request().put(`${baseUrl}/${item.id}`)
            .send({ name: 'updated', num: 10 })
            .expect(200)
          const updatedItem = await getDao().findOneById(item.id!)
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
      await request().delete(`${baseUrl}/${item.id}`)
        .expect(200)
      const deletedItem = await getDao().findOneById(item.id!)
      expect(deletedItem).toBe(null)
    })

    describe('Hooks', () => {
      it('should call beforeDelete and afterDelete', async () => {
        spyOn(entityHooks, 'run')
        await registerTestEntity({ delete: 'anyone' })
        const item = await getDao().insertOne({ name: 'item' })
        await request().delete(`${baseUrl}/${item.id}`)
          .expect(200)
        await getDao().findOneById(item.id!)
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'beforeDelete', item, expect.any(Object))
        expect(entityHooks.run).toHaveBeenCalledWith(entityName, 'afterDelete', item, expect.any(Object))
      })
    })

    describe('Permissions', () => {
      let item: TestEntity
      let user1: string
      let user2: string

      beforeEach(async () => {
        user1 = (await registerNewUser()).id!
        user2 = (await registerNewUser()).id!
        item = await getDao().insertOne({ name: 'item', user: user1 })
      })

      describe('User', () => {
        it('should only delete an item with "user" delete permission if the request is authenticated', async () => {
          await registerTestEntity({ delete: 'user' })
          await request().delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest(user1).delete(`${baseUrl}/${item.id}`)
            .expect(200)
        })
      })

      describe('Own', () => {
        it('should only delete an item with "own" delete permission if the resource is owned by the user', async () => {
          await registerTestEntity({ delete: 'own' })
          await request().delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest(user2).delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest(user1).delete(`${baseUrl}/${item.id}`)
            .expect(200)
        })
      })

      describe('Admin', () => {
        it('should only delete an item with "own" delete permission if the user is an admin', async () => {
          await registerTestEntity({ delete: 'admin' })
          await request().delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest().delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest(admin.id).delete(`${baseUrl}/${item.id}`)
            .expect(200)
        })
      })

      describe('System', () => {
        it('should return an unauthorized error', async () => {
          await registerTestEntity({})
          await request().delete(`${baseUrl}/${item.id}`)
            .expect(401)
          await authenticatedRequest().delete(`${baseUrl}/${item.id}`)
            .expect(401)
        })
      })
    })
  })
})
