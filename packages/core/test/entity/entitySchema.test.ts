import { EntityModel } from '../../src/types'
import { Commun, getModelPropertyValue } from '../../src'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'
import { ObjectId } from 'mongodb'

describe('Entity Schema', () => {
  const entityName = 'modelProperties'
  const collectionName = entityName

  interface TestEntity extends EntityModel {
    key?: string
    foo?: string
    bar?: string
    num?: number
  }

  beforeAll(async () => {
    Commun.registerEntity<TestEntity>({
      config: {
        entityName,
        collectionName,
        schema: {
          properties: {
            key: {
              type: 'string'
            },
            foo: {
              type: 'string'
            },
            bar: {
              type: 'string'
            },
            num: {
              type: 'number'
            },
          }
        }
      }
    })
    await startTestApp(Commun)
  })

  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  describe('getModelPropertyValue', () => {
    describe('User', () => {
      const userId = new ObjectId()

      it('should return an ObjectId with the user id or undefined', async () => {
        expect(getModelPropertyValue({
          property: { $ref: '#user' },
          key: 'key',
          data: {},
          authUserId: userId.toString()
        })).toEqual(userId)
        expect(getModelPropertyValue({
          property: { $ref: '#user' },
          key: 'key',
          data: {}
        })).toBeUndefined()
      })

      it('should handle the default attribute', async () => {
        expect(getModelPropertyValue({
          property: { $ref: '#user', default: userId.toString() },
          key: 'key',
          data: {},
        })).toEqual(userId)
        expect(getModelPropertyValue({
          property: {
            $ref: '#user',
            default: new ObjectId().toString(),
          },
          key: 'key',
          data: {},
          authUserId: userId.toString(),
        })).toEqual(userId)
      })
    })

    describe('Eval', () => {

    })
  })
})