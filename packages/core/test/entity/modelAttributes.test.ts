import { Commun, EntityModel, getModelAttribute, parseModelAttribute } from '../../src'
import { SecurityUtils } from '../../src/utils'
import { ObjectId } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('modelAttributes', () => {
  const entityName = 'modelAttributes'
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
        attributes: {
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
    })
    await startTestApp(Commun)
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  describe('Boolean', () => {
    it('should return true for a truly value', async () => {
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: 'true' }
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: true }
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: {}
      })).toBe(undefined)
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: null }
      })).toBe(undefined)
    })

    it('should return false for a falsy value', async () => {
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: 'false' }
      })).toBe(false)
      expect(getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: false }
      })).toBe(false)
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: { key: 'true' }
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: { key: true }
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: { key: 'false' }
      })).toBe(false)
      expect(getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: { key: false }
      })).toBe(false)
      expect(() => getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
      expect(() => getModelAttribute({
        attribute: { type: 'boolean', required: true },
        key: 'key',
        data: { key: null }
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'boolean', default: true },
        key: 'key',
        data: {}
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean', default: false },
        key: 'key',
        data: {}
      })).toBe(false)
      expect(getModelAttribute({
        attribute: { type: 'boolean', default: false },
        key: 'key',
        data: { key: true }
      })).toBe(true)
      expect(getModelAttribute({
        attribute: { type: 'boolean', default: true },
        key: 'key',
        data: { key: false }
      })).toBe(false)
    })

    it('should throw an error if the value is not boolean', async () => {
      expect(() => getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: 'str' }
      })).toThrow('key must be boolean')
      expect(() => getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: 123 }
      })).toThrow('key must be boolean')
      expect(() => getModelAttribute({
        attribute: { type: 'boolean' },
        key: 'key',
        data: { key: {} }
      })).toThrow('key must be boolean')
    })
  })

  describe('Date', () => {
    it('should return the given date', async () => {
      const date = new Date()
      expect(getModelAttribute({
        attribute: { type: 'date' },
        key: 'key',
        data: { key: date }
      })).toEqual(date)
      expect(getModelAttribute({
        attribute: { type: 'date' },
        key: 'key',
        data: { key: 'Tue Feb 04 2020 UTC' }
      }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
      expect(getModelAttribute({
        attribute: { type: 'date' },
        key: 'key',
        data: { key: 1580774400000 }
      }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
      expect(getModelAttribute({
        attribute: { type: 'date' },
        key: 'key',
        data: { key: '1580774400000' }
      }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
    })

    it('should handle the required attribute', async () => {
      const date = new Date()
      expect(getModelAttribute({
        attribute: { type: 'date', required: true },
        key: 'key',
        data: { key: date }
      })).toEqual(date)
      expect(() => getModelAttribute({
        attribute: { type: 'date', required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      const date1 = new Date()
      const date2 = new Date()
      expect(getModelAttribute({
        attribute: { type: 'date', default: date2 },
        key: 'key',
        data: { key: date1 }
      })).toEqual(date1)
      expect(getModelAttribute({
        attribute: { type: 'date', default: date2 },
        key: 'key',
        data: {}
      })).toEqual(date2)
    })

    it('should throw an error if the value is not a date', async () => {
      expect(() => getModelAttribute({
        attribute: { type: 'date' },
        key: 'key',
        data: { key: 'bad date' }
      })).toThrow('key must be a date')
    })
  })

  describe('Email', () => {
    it('should return the given email', async () => {
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: 'email@example.org' }
      })).toBe('email@example.org')
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: 'email@s.example.org' }
      })).toBe('email@s.example.org')
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: 'a.b@example.org' }
      })).toBe('a.b@example.org')
      expect(await getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: 'a.b@s.example.org' }
      })).toBe('a.b@s.example.org')
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: '' }
      })).toBe(undefined)
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: {}
      })).toBe(undefined)
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: null }
      })).toBe(undefined)
    })

    it('should return the email trimmed', async () => {
      expect(await getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: 'email@example.org   ' }
      })).toBe('email@example.org')
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: '   email@example.org' }
      })).toBe('email@example.org')
      expect(getModelAttribute({
        attribute: { type: 'email' },
        key: 'key',
        data: { key: '   email@example.org   ' }
      })).toBe('email@example.org')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: 'email@example.org' }
      })).toBe('email@example.org')
      expect(() => getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: null }
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'email', default: 'email@example.org' },
        key: 'key',
        data: {}
      })).toBe('email@example.org')
      expect(getModelAttribute({
        attribute: { type: 'email', default: 'email@example.org' },
        key: 'key',
        data: {
          key: 'test-email@example.org'
        }
      })).toBe('test-email@example.org')
    })

    it('should throw an error if the email is not valid', async () => {
      expect(() => getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: 'email' }
      })).toThrow('key is not a valid email address')
      expect(() => getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: 'email@' }
      })).toThrow('key is not a valid email address')
      expect(() => getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: '@example.org' }
      })).toThrow('key is not a valid email address')
      expect(() => getModelAttribute({
        attribute: { type: 'email', required: true },
        key: 'key',
        data: { key: 'email@@example.org' }
      })).toThrow('key is not a valid email address')
    })
  })

  describe('Enum', () => {
    it('should return the given value', async () => {
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3] },
        key: 'key',
        data: { key: 1 }
      })).toBe(1)
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3] },
        key: 'key',
        data: { key: 2 }
      })).toBe(2)
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3] },
        key: 'key',
        data: { key: 3 }
      })).toBe(3)
    })

    it('should throw an error if the given value is not in the enum', async () => {
      expect(() => getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3] },
        key: 'key',
        data: { key: 4 }
      })).toThrow('key must be one of 1, 2, 3')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3], required: true },
        key: 'key',
        data: { key: 1 }
      })).toBe(1)
      expect(() => getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3], required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3], default: 2 },
        key: 'key',
        data: {}
      })).toBe(2)
      expect(getModelAttribute({
        attribute: { type: 'enum', values: [1, 2, 3], default: 2 },
        key: 'key',
        data: { key: 1 }
      })).toBe(1)
    })
  })

  describe('Eval', () => {
    it('should return the given value', async () => {
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: 'test' },
        key: 'key',
        data: {}
      })).toBe('test')
    })

    it('should parse simple math', async () => {
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: 'Val: {2 + 2}' },
        key: 'key',
        data: {}
      })).toBe('Val: 4')
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: 'Val: {this.num * 2}' },
        key: 'key',
        data: { key: null, num: 3 }
      })).toBe('Val: 6')
    })

    it('should parse model values', async () => {
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: '{this.foo}' },
        key: 'key',
        data: { key: null, foo: 'bar' }
      })).toBe('bar')
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: '{this.foo}:{this.bar}' },
        key: 'key',
        data: { key: null, foo: '1', bar: '2' }
      })).toBe('1:2')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: '{this.key}', required: true },
        key: 'key',
        data: { key: 'test' }
      })).toBe('test')
      await expect(getModelAttribute({
        entityName,
        attribute: { type: 'eval', eval: '{this.key}', required: true },
        key: 'key',
        data: { key: '' }
      })).rejects.toThrow('key is required')
    })
  })

  describe('List', () => {
    it('should return the given list parsed to the list type', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: ['1', '2', '3'] }
      })).toEqual([1, 2, 3])

      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          listType: { type: 'string', maxLength: 3 }
        },
        key: 'key',
        data: { key: ['a', 'b', 'c'] }
      })).toEqual(['a', 'b', 'c'])
    })

    it('should throw an error if one of the items of the list does not respect the constraints', async () => {
      await expect(getModelAttribute({
        attribute: {
          type: 'list',
          listType: { type: 'string', maxLength: 3 }
        },
        key: 'key',
        data: { key: ['a', 'b', 'long-string'] }
      })).rejects.toThrow(/key index 2 must be shorter than 3 characters/)

      await expect(getModelAttribute({
        attribute: {
          type: 'list',
          listType: { type: 'email' }
        },
        key: 'key',
        data: { key: ['not an email'] }
      })).rejects.toThrow(/key index 0 is not a valid email address/)
    })

    it('should handle the maxItems attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          maxItems: 3,
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: [1, 2, 3] }
      })).toEqual([1, 2, 3])

      expect(() => getModelAttribute({
        attribute: {
          type: 'list',
          maxItems: 3,
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: [1, 2, 3, 4, 5] }
      })).toThrow(/key can contain up to 3 items/)
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          required: true,
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: [1, 2, 3] }
      })).toEqual([1, 2, 3])

      expect(() => getModelAttribute({
        attribute: {
          type: 'list',
          required: true,
          listType: { type: 'number' }
        },
        key: 'key',
        data: {}
      })).toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          default: [9, 8, 7],
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: [1, 2, 3] }
      })).toEqual([1, 2, 3])

      expect(await getModelAttribute({
        attribute: {
          type: 'list',
          default: [9, 8, 7],
          listType: { type: 'number' }
        },
        key: 'key',
        data: {}
      })).toEqual([9, 8, 7])
    })

    it('should throw an error if the value is not an array', async () => {
      expect(() => getModelAttribute({
        attribute: {
          type: 'list',
          listType: { type: 'number' }
        },
        key: 'key',
        data: { key: 'not an array' }
      })).toThrow(/key must be an array/)
    })
  })

  describe('Map', () => {
    it('should return the given map with key and value parsed', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: { key: { a: '1', b: '2' } }
      })).toEqual({ a: 1, b: 2 })

      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string' },
          valueType: { type: 'string', maxLength: 3 },
        },
        key: 'key',
        data: { key: { a: '1', b: '2' } }
      })).toEqual({ a: '1', b: '2' })
    })

    it('should throw an error if a key of the map does not respect a constrain', async () => {
      await expect(getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string', maxLength: 3 },
          valueType: { type: 'number' },
        },
        key: 'map',
        data: { map: { abcd: '1' } }
      })).rejects.toThrow(/map key must be shorter than 3 characters/)
    })

    it('should throw an error if a value of the map does not respect a constrain', async () => {
      await expect(getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string' },
          valueType: { type: 'number', max: 5 },
        },
        key: 'map',
        data: { map: { a: 1, b: 6 } }
      })).rejects.toThrow(/map b must be smaller or equal than 5/)

      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'enum', values: ['a', 'b'] },
          valueType: { type: 'number' },
        },
        key: 'map',
        data: { map: { a: 1, b: 2 } }
      })).toEqual({ a: 1, b: 2 })

      await expect(getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'enum', values: ['a', 'b'] },
          valueType: { type: 'number' },
        },
        key: 'map',
        data: { map: { a: 1, c: 2 } }
      })).rejects.toThrow(/map key must be one of a, b/)
    })

    it('should support map o maps', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string' },
          valueType: { type: 'map', keyType: { type: 'string' }, valueType: { type: 'number' } },
        },
        key: 'key',
        data: { key: { a: { b: '1' }, c: { d: '2' } } }
      })).toEqual({ a: { b: 1 }, c: { d: 2 } })
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          required: true,
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: { key: { a: '1', b: '2' } }
      })).toEqual({ a: 1, b: 2 })

      expect(() => getModelAttribute({
        attribute: {
          type: 'map',
          required: true,
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: {}
      })).toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          default: { z: 1, x: 2 },
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: { key: { a: '1', b: '2' } }
      })).toEqual({ a: 1, b: 2 })

      expect(await getModelAttribute({
        attribute: {
          type: 'map',
          default: { z: 1, x: 2 },
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: {}
      })).toEqual({ z: 1, x: 2 })
    })

    it('should throw an error if the value is not a map', async () => {
      expect(() => getModelAttribute({
        attribute: {
          type: 'map',
          keyType: { type: 'string' },
          valueType: { type: 'number' },
        },
        key: 'key',
        data: { key: 123 }
      })).toThrow(/key must be an object/)
    })
  })

  describe('Number', () => {
    it('should return the given number', async () => {
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: 123 }
      })).toBe(123)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: '123' }
      })).toBe(123)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: 0 }
      })).toBe(0)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: .5 }
      })).toBe(.5)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: '.5' }
      })).toBe(.5)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: '0.5' }
      })).toBe(.5)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: {}
      })).toBe(undefined)
      expect(getModelAttribute({
        attribute: { type: 'number' },
        key: 'key',
        data: { key: null }
      })).toBe(undefined)
    })

    it('should handle the max attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'number', max: 100 },
        key: 'key',
        data: { key: 100 }
      })).toBe(100)
      expect(() => getModelAttribute({
        attribute: { type: 'number', max: 100 },
        key: 'key',
        data: { key: 101 }
      })).toThrow('key must be smaller or equal than 100')
    })

    it('should handle then min attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'number', min: 100 },
        key: 'key',
        data: { key: 100 }
      })).toBe(100)
      expect(() => getModelAttribute({
        attribute: { type: 'number', min: 100 },
        key: 'key',
        data: { key: 99 }
      })).toThrow('key must be larger or equal than 100')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: 0 }
      })).toBe(0)
      expect(getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: '0' }
      })).toBe(0)
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: null }
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'number', default: 123 },
        key: 'key',
        data: {}
      })).toBe(123)
      expect(getModelAttribute({
        attribute: { type: 'number', default: 123 },
        key: 'key',
        data: { key: 987 }
      })).toBe(987)
    })

    it('should throw an error if the value is not a number', async () => {
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: 'wrong' }
      })).toThrow('key must be a number')
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: true }
      })).toThrow('key must be a number')
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: false }
      })).toThrow('key must be a number')
      expect(() => getModelAttribute({
        attribute: { type: 'number', required: true },
        key: 'key',
        data: { key: {} }
      })).toThrow('key must be a number')
    })
  })

  describe('Object', () => {
    it('should return the given object with all elements parsed', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'object',
          fields: {
            a: { type: 'string' },
            b: { type: 'boolean' },
            c: { type: 'number' },
          },
        },
        key: 'key',
        data: { key: { a: 'test', b: 'true', c: '123' } }
      })).toEqual({
        a: 'test',
        b: true,
        c: 123,
      })
    })

    it('should throw an error if onefield does not respect the constraints', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'object',
          fields: {
            a: { type: 'string' },
            b: { type: 'boolean' },
            c: { type: 'number', max: 10 },
          },
        },
        key: 'key',
        data: { key: { a: 'test', b: 'true', c: '10' } }
      })).toEqual({
        a: 'test',
        b: true,
        c: 10,
      })

      await expect(getModelAttribute({
        attribute: {
          type: 'object',
          fields: {
            a: { type: 'string' },
            b: { type: 'boolean' },
            c: { type: 'number', max: 10 },
          },
        },
        key: 'key',
        data: { key: { a: 'test', b: 'true', c: '11' } }
      })).rejects.toThrow('c must be smaller or equal than 10')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'object',
          required: true,
          fields: { a: { type: 'string' }, },
        },
        key: 'key',
        data: { key: { a: 'test' } }
      })).toEqual({ a: 'test' })

      await expect(getModelAttribute({
        attribute: {
          type: 'object',
          required: true,
          fields: { a: { type: 'string' }, },
        },
        key: 'key',
        data: {}
      })).rejects.toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        attribute: {
          type: 'object',
          fields: { a: { type: 'string' }, },
          default: { a: 'default' },
        },
        key: 'key',
        data: { key: { a: 'test' } }
      })).toEqual({ a: 'test' })

      expect(await getModelAttribute({
        attribute: {
          type: 'object',
          fields: { a: { type: 'string' }, },
          default: { a: 'default' },
        },
        key: 'key',
        data: {}
      })).toEqual({ a: 'default' })
    })

    it('should throw an error if the value is not an object', async () => {
      await expect(getModelAttribute({
        attribute: {
          type: 'object',
          fields: { a: { type: 'string' }, },
        },
        key: 'key',
        data: { key: 'not an object' }
      })).rejects.toThrow(/key must be an object/)
    })
  })

  describe('Ref', () => {
    let itemId: string

    beforeEach(async () => {
      Commun.registerEntity({
        config: {
          entityName,
          collectionName,
          attributes: {},
        }
      })
      const item = await Commun.getEntityDao(entityName).insertOne({})
      itemId = item.id!
    })

    it('should return an ObjectId with the referenced value', async () => {
      const res = await getModelAttribute({
        attribute: { type: 'ref', entity: entityName },
        key: 'item',
        data: { item: itemId }
      })
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)
    })

    it('should throw an error if value is not a valid ObjectId', async () => {
      await expect(getModelAttribute({
        attribute: { type: 'ref', entity: entityName },
        key: 'item',
        data: { item: 'bad-id' }
      })).rejects.toThrow('item is not a valid ID')
    })

    it('should throw an error if the value does not reference to an existent resource', async () => {
      const objectId = new ObjectId()
      await expect(getModelAttribute({
        attribute: { type: 'ref', entity: entityName },
        key: 'item',
        data: { item: objectId.toString() }
      })).rejects.toThrow('item not found')
    })

    it('should handle the required attribute', async () => {
      const res = await getModelAttribute({
        attribute: {
          type: 'ref',
          entity: entityName,
          required: true
        },
        key: 'item',
        data: { item: itemId }
      })
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)

      await expect(getModelAttribute({
        attribute: { type: 'ref', entity: entityName, required: true },
        key: 'item',
        data: {}
      })).rejects.toThrow('item is required')
    })

    it('should handle the default attribute', async () => {
      const res = await getModelAttribute({
        attribute: { type: 'ref', entity: entityName, default: itemId },
        key: 'item',
        data: {}
      })
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)
      const res2 = await getModelAttribute({
        attribute: {
          type: 'ref',
          entity: entityName,
          default: new ObjectId().toString()
        },
        key: 'item',
        data: { item: itemId }
      })
      expect(res2 instanceof ObjectId).toBe(true)
      expect(res2.toString()).toBe(itemId)
    })
  })

  describe('Slug', () => {
    beforeEach(() => {
      SecurityUtils.generateRandomString = jest.fn((chars) => `RANDOM:${chars}`)
    })

    it('should return a slug string from the target', async () => {
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title' },
        key: 'key',
        data: {
          title: 'Test Title',
          key: ''
        }
      })).toBe('test-title')
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title' },
        key: 'key',
        data: {
          title: '  TEST  ',
          key: ''
        }
      })).toBe('test')
      expect(getModelAttribute({
          attribute: { type: 'slug', setFrom: 'title' },
          key: 'key',
          data: {
            title: 'This is   @1   title?!',
            key: ''
          }
        })
      ).toBe('this-is-1-title')
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title' },
        key: 'key',
        data: {
          title: '---$ Test Title $---',
          key: ''
        }
      })).toBe('test-title')
    })

    it('should handle the prefix attribute', async () => {
      expect(getModelAttribute({
        attribute: {
          type: 'slug',
          setFrom: 'title',
          prefix: { type: 'random', chars: 8 }
        },
        key: 'key',
        data: {
          title: 'test',
          key: ''
        }
      })).toBe('RANDOM:8-test')
    })

    it('should handle the suffix attribute', async () => {
      expect(getModelAttribute({
        attribute: {
          type: 'slug',
          setFrom: 'title',
          suffix: { type: 'random', chars: 8 }
        },
        key: 'key',
        data: {
          title: 'test',
          key: ''
        }
      })).toBe('test-RANDOM:8')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title', required: true },
        key: 'key',
        data: {
          title: 'test',
          key: ''
        }
      })).toBe('test')
      expect(() => getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title', required: true },
        key: 'key',
        data: {
          title: '',
          key: ''
        }
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title', default: 'default' },
        key: 'key',
        data: {}
      })).toBe('default')
      expect(getModelAttribute({
        attribute: { type: 'slug', setFrom: 'title', default: 'default' },
        key: 'key',
        data: {
          title: 'test',
          key: ''
        }
      })).toBe('test')
    })
  })

  describe('String', () => {
    it('should return the given string', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: 'test' }
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: '123' }
      })).toBe('123')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: 123 }
      })).toBe('123')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: 0 }
      })).toBe('0')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: true }
      })).toBe('true')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: false }
      })).toBe('false')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: '' }
      })).toBe('')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: {}
      })).toBe(undefined)
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: null }
      })).toBe(undefined)
    })

    it('should return the given string trimmed', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: 'test  ' }
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: '  test' }
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string' },
        key: 'key',
        data: { key: '  test  ' }
      })).toBe('test')
    })

    it('should handle the maxLength attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string', maxLength: 4 },
        key: 'key',
        data: { key: 'test' }
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string', maxLength: 4 },
        key: 'key',
        data: { key: 'test    ' }
      })).toBe('test')
      expect(() => getModelAttribute({
        attribute: { type: 'string', maxLength: 3 },
        key: 'key',
        data: { key: 'test' }
      })).toThrow('key must be shorter than 3 characters')
    })

    it('should handle the validRegex attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-z]*$' },
        key: 'key',
        data: { key: 'test' }
      })).toBe('test')
      expect(() => getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-z]*$' },
        key: 'key',
        data: { key: 'Test' }
      })).toThrow('key contains invalid characters')

      expect(getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-zA-Z]*$' },
        key: 'key',
        data: { key: 'Test' }
      })).toBe('Test')
      expect(() => getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-zA-Z]*$' },
        key: 'key',
        data: { key: 'Test 1' }
      })).toThrow('key contains invalid characters')

      expect(getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-z0-9\\s]*$' },
        key: 'key',
        data: { key: 'test 123' }
      })).toBe('test 123')
      expect(() => getModelAttribute({
        attribute: { type: 'string', validRegex: '^[a-z0-9\\s]*$' },
        key: 'key',
        data: { key: 'test @1' }
      })).toThrow('key contains invalid characters')
    })

    it('should handle the hash attribute', async () => {
      SecurityUtils.hashWithBcrypt = jest
        .fn(async (str: string, saltRounds: number) => `hashed_${str}_${saltRounds}`)

      expect(await getModelAttribute({
        attribute: {
          type: 'string',
          hash: { algorithm: 'bcrypt', salt_rounds: 12 }
        },
        key: 'key',
        data: { key: 'test' }
      })).toBe('hashed_test_12')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: { key: 'test' }
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: { key: 0 }
      })).toBe('0')
      expect(() => getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: { key: '' }
      })).toThrow('key is required')
      expect(() => getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: { key: null }
      })).toThrow('key is required')
      expect(() => getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
      expect(() => getModelAttribute({
        attribute: { type: 'string', required: true },
        key: 'key',
        data: { key: '    ' }
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'string', default: 'test' },
        key: 'key',
        data: {}
      })).toBe('test')
      expect(getModelAttribute({
        attribute: { type: 'string', default: 'test' },
        key: 'key',
        data: { key: 'aaa' }
      })).toBe('aaa')
    })
  })

  describe('User', () => {
    const userId = new ObjectId()

    it('should return an ObjectId with the user id or undefined', async () => {
      expect(getModelAttribute({
        attribute: { type: 'user' },
        key: 'key',
        data: {},
        userId: userId.toString()
      })).toEqual(userId)
      expect(getModelAttribute({
        attribute: { type: 'user' },
        key: 'key',
        data: {}
      })).toBeUndefined()
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'user', required: true },
        key: 'key',
        data: {},
        userId: userId.toString()
      })).toEqual(userId)
      expect(() => getModelAttribute({
        attribute: { type: 'user', required: true },
        key: 'key',
        data: {}
      })).toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(getModelAttribute({
        attribute: { type: 'user', default: userId.toString() },
        key: 'key',
        data: {}
      })).toEqual(userId)
      expect(getModelAttribute({
        attribute: {
          type: 'user',
          default: new ObjectId().toString()
        },
        key: 'key',
        data: {},
        userId: userId.toString()
      })).toEqual(userId)
    })
  })
})

describe('parseModelAttribute', () => {
  it('should parse the value according the attribute type', async () => {
    expect(parseModelAttribute({ type: 'boolean' }, 'true')).toBe(true)
    expect(parseModelAttribute({ type: 'boolean' }, 'false')).toBe(false)

    const date = new Date()
    expect(parseModelAttribute({ type: 'date' }, date)).toEqual(date)
    expect(parseModelAttribute({ type: 'date' }, 'Tue Feb 04 2020 UTC')).toEqual(new Date('Tue Feb 04 2020 UTC'))
    expect(parseModelAttribute({ type: 'date' }, 1580774400000)).toEqual(new Date('Tue Feb 04 2020 UTC'))
    expect(parseModelAttribute({ type: 'date' }, '1580774400000')).toEqual(new Date('Tue Feb 04 2020 UTC'))

    expect(parseModelAttribute({ type: 'string' }, 'test')).toBe('test')
    expect(parseModelAttribute({ type: 'email' }, 'test@example.org')).toBe('test@example.org')
    expect(parseModelAttribute({ type: 'slug', setFrom: 'key' }, 'test')).toBe('test')
    expect(parseModelAttribute({ type: 'number' }, '123')).toBe(123)

    const objectId = new ObjectId()
    expect(parseModelAttribute({ type: 'user' }, objectId.toString())).toEqual(objectId)
    expect(parseModelAttribute({ type: 'user' }, objectId.toString()) instanceof ObjectId).toBe(true)
    expect(parseModelAttribute({ type: 'ref', entity: 'e' }, objectId.toString())).toEqual(objectId)
    expect(parseModelAttribute({ type: 'ref', entity: 'e' }, objectId.toString()) instanceof ObjectId).toBe(true)

    expect(parseModelAttribute({ type: 'enum', values: [1, 2, 3] }, 2)).toBe(2)
    expect(parseModelAttribute({ type: 'enum', values: [1, 2, 3] }, 4)).toBeUndefined()

    expect(parseModelAttribute({ type: 'list', listType: { type: 'number' } }, [])).toEqual([])
    expect(parseModelAttribute({ type: 'list', listType: { type: 'number' } }, ['1', '2', '3'])).toEqual([1, 2, 3])
    expect(parseModelAttribute({
      type: 'list',
      listType: { type: 'boolean' }
    }, ['true', 'false'])).toEqual([true, false])

    expect(parseModelAttribute({
      type: 'map',
      keyType: { type: 'string' },
      valueType: { type: 'number' }
    }, {})).toEqual({})
    expect(parseModelAttribute({
      type: 'map',
      keyType: { type: 'string' },
      valueType: { type: 'number' }
    }, { a: '1', b: '2' })).toEqual({ a: 1, b: 2 })
    expect(parseModelAttribute({
      type: 'map',
      keyType: { type: 'string' },
      valueType: { type: 'boolean' }
    }, { a: 'true', b: 'false' })).toEqual({ a: true, b: false })

    expect(parseModelAttribute({
      type: 'object',
      fields: {
        a: { type: 'string' },
        b: { type: 'boolean' },
        c: { type: 'number' },
      },
    }, { a: 'test', b: 'true', c: '123' })).toEqual({ a: 'test', b: true, c: 123 })
  })
})
