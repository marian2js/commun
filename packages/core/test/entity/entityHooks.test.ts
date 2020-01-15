import { Commun, EntityHook, EntityLifecycle, EntityModel } from '../../src'
import { entityHooks } from '../../src/entity/entityHooks'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('entityHooks', () => {
  describe('run', () => {
    const entityName = 'entityHooks'
    const collectionName = 'entityHooks'

    interface TestEntity extends EntityModel {
      name?: string
      value?: number
      num?: number
      ref?: string
    }

    const registerTestEntity = (lifecycle: EntityLifecycle, hook: EntityHook[]) => {
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
            value: {
              type: 'number',
            },
            num: {
              type: 'number',
            },
            ref: {
              type: 'ref',
              entity: entityName
            }
          },
          [lifecycle]: hook
        }
      })
    }

    const getDao = () => Commun.getEntityDao<TestEntity>(entityName)
    const getController = () => Commun.getEntityDao<TestEntity>(entityName)

    beforeAll(async () => await startTestApp(Commun))
    afterEach(async () => await stopTestApp(collectionName))
    afterAll(closeTestApp)

    describe('Hook Conditions', () => {
      it('should run the hook if the condition is true', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: 3,
          target: 'this.value',
          condition: {
            left: '{this.value}',
            right: 2,
            comparator: '=',
          }
        }])
        const item = await getDao().insertOne({ value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(5)
      })

      it('should not run the hook if the condition is false', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: 3,
          target: 'this.value',
          condition: {
            left: '{this.value}',
            right: 2,
            comparator: '!=',
          }
        }])
        const item = await getDao().insertOne({ value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(2)
      })
    })

    describe('Increment', () => {
      it('should increment the value of a local attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: 3,
          target: 'this.value'
        }])
        const item = await getDao().insertOne({ value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(5)
      })

      it('should increment the value of a reference attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: 3,
          target: 'this.ref.value'
        }])
        const item1 = await getDao().insertOne({ value: 2 })
        const item2 = await getDao().insertOne({ ref: item1._id!.toString(), value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item2)
        const updatedItem1 = await getDao().findOneById(item1._id!)
        expect(updatedItem1!.value).toBe(5)
        const updatedItem2 = await getDao().findOneById(item2._id!)
        expect(updatedItem2!.value).toBe(2)
      })

      it('should increment a value using a local attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: '{this.num}',
          target: 'this.value'
        }])
        const item = await getDao().insertOne({ value: 2, num: 3 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(5)
      })

      it('should increment a value using a reference attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'increment',
          value: '{this.ref.num}',
          target: 'this.value'
        }])
        const item1 = await getDao().insertOne({ num: 3 })
        const item2 = await getDao().insertOne({ ref: item1._id!.toString(), value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item2)
        const updatedItem = await getDao().findOneById(item2._id!)
        expect(updatedItem!.value).toBe(5)
      })
    })

    describe('Set', () => {
      it('should set the value of a local attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'set',
          value: 3,
          target: 'this.value'
        }])
        const item = await getDao().insertOne({ value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(3)
      })

      it('should set the value of a reference attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'set',
          value: 3,
          target: 'this.ref.value'
        }])
        const item1 = await getDao().insertOne({ value: 2 })
        const item2 = await getDao().insertOne({ ref: item1._id!.toString(), value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item2)
        const updatedItem1 = await getDao().findOneById(item1._id!)
        expect(updatedItem1!.value).toBe(3)
        const updatedItem2 = await getDao().findOneById(item2._id!)
        expect(updatedItem2!.value).toBe(2)
      })

      it('should set a value using a local attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'set',
          value: '{this.num}',
          target: 'this.value'
        }])
        const item = await getDao().insertOne({ value: 2, num: 3 })
        await entityHooks.run(entityName, 'afterUpdate', item)
        const updatedItem = await getDao().findOneById(item._id!)
        expect(updatedItem!.value).toBe(3)
      })

      it('should increment a value using a reference attribute', async () => {
        registerTestEntity('afterUpdate', [{
          action: 'set',
          value: '{this.ref.num}',
          target: 'this.value'
        }])
        const item1 = await getDao().insertOne({ num: 3 })
        const item2 = await getDao().insertOne({ ref: item1._id!.toString(), value: 2 })
        await entityHooks.run(entityName, 'afterUpdate', item2)
        const updatedItem = await getDao().findOneById(item2._id!)
        expect(updatedItem!.value).toBe(3)
      })
    })
  })
})
