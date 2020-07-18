import { Commun, getModelAttribute, parseModelAttribute } from '../../src'
import { SecurityUtils } from '../../src/utils'
import { ObjectId } from 'mongodb'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'

describe('modelAttributes', () => {
  const entityName = 'modelAttributes'
  const collectionName = entityName

  beforeAll(async () => await startTestApp(Commun))
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  describe('Boolean', () => {
    it('should return true for a truly value', async () => {
      expect(await getModelAttribute({ type: 'boolean' }, 'key', { key: 'true' })).toBe(true)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', { key: true })).toBe(true)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', {})).toBe(undefined)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', { key: null })).toBe(undefined)
    })

    it('should return false for a falsy value', async () => {
      expect(await getModelAttribute({ type: 'boolean' }, 'key', { key: 'false' })).toBe(false)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', { key: false })).toBe(false)
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', { key: 'true' })).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', { key: true })).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', { key: 'false' })).toBe(false)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', { key: false })).toBe(false)
      await expect(getModelAttribute({ type: 'boolean', required: true }, 'key', {}))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'boolean', required: true }, 'key', { key: null }))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'boolean', default: true }, 'key', {})).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', default: false }, 'key', {})).toBe(false)
      expect(await getModelAttribute({ type: 'boolean', default: false }, 'key', { key: true })).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', default: true }, 'key', { key: false })).toBe(false)
    })

    it('should throw an error if the value is not boolean', async () => {
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: 'str' }))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: 123 }))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: {} }))
        .rejects.toThrow('key must be boolean')
    })
  })

  describe('Date', () => {
    it('should return the given date', async () => {
      const date = new Date()
      expect(await getModelAttribute({ type: 'date' }, 'key', { key: date })).toEqual(date)
      expect(await getModelAttribute({ type: 'date' }, 'key', { key: 'Tue Feb 04 2020 UTC' }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
      expect(await getModelAttribute({ type: 'date' }, 'key', { key: 1580774400000 }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
      expect(await getModelAttribute({ type: 'date' }, 'key', { key: '1580774400000' }))
        .toEqual(new Date('Tue Feb 04 2020 UTC'))
    })

    it('should handle the required attribute', async () => {
      const date = new Date()
      expect(await getModelAttribute({ type: 'date', required: true }, 'key', { key: date })).toEqual(date)
      await expect(getModelAttribute({ type: 'date', required: true }, 'key', {}))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      const date1 = new Date()
      const date2 = new Date()
      expect(await getModelAttribute({ type: 'date', default: date2 }, 'key', { key: date1 })).toEqual(date1)
      expect(await getModelAttribute({ type: 'date', default: date2 }, 'key', {})).toEqual(date2)
    })

    it('should throw an error if the value is not a date', async () => {
      await expect(getModelAttribute({ type: 'date' }, 'key', { key: 'bad date' }))
        .rejects.toThrow('key must be a date')
    })
  })

  describe('Email', () => {
    it('should return the given email', async () => {
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: 'email@example.org' }))
        .toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: 'email@s.example.org' }))
        .toBe('email@s.example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: 'a.b@example.org' }))
        .toBe('a.b@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: 'a.b@s.example.org' }))
        .toBe('a.b@s.example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: '' })).toBe(undefined)
      expect(await getModelAttribute({ type: 'email' }, 'key', {})).toBe(undefined)
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: null })).toBe(undefined)
    })

    it('should return the email trimmed', async () => {
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: 'email@example.org   ' }))
        .toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: '   email@example.org' }))
        .toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', { key: '   email@example.org   ' }))
        .toBe('email@example.org')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'email', required: true }, 'key', { key: 'email@example.org' }))
        .toBe('email@example.org')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', { key: null }))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'email', default: 'email@example.org' }, 'key', {}))
        .toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email', default: 'email@example.org' }, 'key', {
        key: 'test-email@example.org'
      })).toBe('test-email@example.org')
    })

    it('should throw an error if the email is not valid', async () => {
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', { key: 'email' }))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', { key: 'email@' }))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', { key: '@example.org' }))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', { key: 'email@@example.org' }))
        .rejects.toThrow('key is not a valid email address')
    })
  })

  describe('Enum', () => {
    it('should return the given value', async () => {
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3] }, 'key', { key: 1 })).toBe(1)
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3] }, 'key', { key: 2 })).toBe(2)
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3] }, 'key', { key: 3 })).toBe(3)
    })

    it('should throw an error if the given value is not in the enum', async () => {
      await expect(getModelAttribute({ type: 'enum', values: [1, 2, 3] }, 'key', { key: 4 }))
        .rejects.toThrow('key must be one of 1, 2, 3')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3], required: true }, 'key', { key: 1 }))
        .toBe(1)
      await expect(getModelAttribute({ type: 'enum', values: [1, 2, 3], required: true }, 'key', {}))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3], default: 2 }, 'key', {}))
        .toBe(2)
      expect(await getModelAttribute({ type: 'enum', values: [1, 2, 3], default: 2 }, 'key', { key: 1 }))
        .toBe(1)
    })
  })

  describe('List', () => {
    it('should return the given list parsed to the list type', async () => {
      expect(await getModelAttribute({
        type: 'list',
        listType: { type: 'number' }
      }, 'key', { key: ['1', '2', '3'] })).toEqual([1, 2, 3])

      expect(await getModelAttribute({
        type: 'list',
        listType: { type: 'string', maxLength: 3 }
      }, 'key', { key: ['a', 'b', 'c'] })).toEqual(['a', 'b', 'c'])
    })

    it('should throw an error if one of the items of the list does not respect the constraints', async () => {
      await expect(getModelAttribute({
        type: 'list',
        listType: { type: 'string', maxLength: 3 }
      }, 'key', { key: ['a', 'b', 'long-string'] })).rejects.toThrow(/key index 2 must be shorter than 3 characters/)

      await expect(getModelAttribute({
        type: 'list',
        listType: { type: 'email' }
      }, 'key', { key: ['not an email'] })).rejects.toThrow(/key index 0 is not a valid email address/)
    })

    it('should handle the maxItems attribute', async () => {
      expect(await getModelAttribute({
        type: 'list',
        maxItems: 3,
        listType: { type: 'number' }
      }, 'key', { key: [1, 2, 3] })).toEqual([1, 2, 3])

      await expect(getModelAttribute({
        type: 'list',
        maxItems: 3,
        listType: { type: 'number' }
      }, 'key', { key: [1, 2, 3, 4, 5] })).rejects.toThrow(/key can contain up to 3 items/)
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        type: 'list',
        required: true,
        listType: { type: 'number' }
      }, 'key', { key: [1, 2, 3] })).toEqual([1, 2, 3])

      await expect(getModelAttribute({
        type: 'list',
        required: true,
        listType: { type: 'number' }
      }, 'key', {})).rejects.toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        type: 'list',
        default: [9, 8, 7],
        listType: { type: 'number' }
      }, 'key', { key: [1, 2, 3] })).toEqual([1, 2, 3])

      expect(await getModelAttribute({
        type: 'list',
        default: [9, 8, 7],
        listType: { type: 'number' }
      }, 'key', {})).toEqual([9, 8, 7])
    })

    it('should throw an error if the value is not an array', async () => {
      await expect(getModelAttribute({
        type: 'list',
        listType: { type: 'number' }
      }, 'key', { key: 'not an array' })).rejects.toThrow(/key must be an array/)
    })
  })

  describe('Map', () => {
    it('should return the given map with key and value parsed', async () => {
      expect(await getModelAttribute({
        type: 'map',
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', { key: { a: '1', b: '2' } })).toEqual({ a: 1, b: 2 })

      expect(await getModelAttribute({
        type: 'map',
        keyType: { type: 'string' },
        valueType: { type: 'string', maxLength: 3 },
      }, 'key', { key: { a: '1', b: '2' } })).toEqual({ a: '1', b: '2' })
    })

    it('should throw an error if a key of the map does not respect a constrain', async () => {
      await expect(getModelAttribute({
        type: 'map',
        keyType: { type: 'string', maxLength: 3 },
        valueType: { type: 'number' },
      }, 'map', { map: { abcd: '1' } })).rejects.toThrow(/map key must be shorter than 3 characters/)
    })

    it('should throw an error if a value of the map does not respect a constrain', async () => {
      await expect(getModelAttribute({
        type: 'map',
        keyType: { type: 'string' },
        valueType: { type: 'number', max: 5 },
      }, 'map', { map: { a: 1, b: 6 } })).rejects.toThrow(/map b must be smaller or equal than 5/)

      expect(await getModelAttribute({
        type: 'map',
        keyType: { type: 'enum', values: ['a', 'b'] },
        valueType: { type: 'number' },
      }, 'map', { map: { a: 1, b: 2 } })).toEqual({ a: 1, b: 2 })

      await expect(getModelAttribute({
        type: 'map',
        keyType: { type: 'enum', values: ['a', 'b'] },
        valueType: { type: 'number' },
      }, 'map', { map: { a: 1, c: 2 } })).rejects.toThrow(/map key must be one of a, b/)
    })

    it('should support map o maps', async () => {
      expect(await getModelAttribute({
        type: 'map',
        keyType: { type: 'string' },
        valueType: { type: 'map', keyType: { type: 'string' }, valueType: { type: 'number' } },
      }, 'key', { key: { a: { b: '1' }, c: { d: '2' } } })).toEqual({ a: { b: 1 }, c: { d: 2 } })
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        type: 'map',
        required: true,
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', { key: { a: '1', b: '2' } })).toEqual({ a: 1, b: 2 })

      await expect(getModelAttribute({
        type: 'map',
        required: true,
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', {})).rejects.toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        type: 'map',
        default: { z: 1, x: 2 },
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', { key: { a: '1', b: '2' } })).toEqual({ a: 1, b: 2 })

      expect(await getModelAttribute({
        type: 'map',
        default: { z: 1, x: 2 },
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', {})).toEqual({ z: 1, x: 2 })
    })

    it('should throw an error if the value is not a map', async () => {
      await expect(getModelAttribute({
        type: 'map',
        keyType: { type: 'string' },
        valueType: { type: 'number' },
      }, 'key', { key: 123 })).rejects.toThrow(/key must be an object/)
    })
  })

  describe('Number', () => {
    it('should return the given number', async () => {
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: 123 })).toBe(123)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: '123' })).toBe(123)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: 0 })).toBe(0)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: .5 })).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: '.5' })).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: '0.5' })).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', {})).toBe(undefined)
      expect(await getModelAttribute({ type: 'number' }, 'key', { key: null })).toBe(undefined)
    })

    it('should handle the max attribute', async () => {
      expect(await getModelAttribute({ type: 'number', max: 100 }, 'key', { key: 100 })).toBe(100)
      await expect(getModelAttribute({ type: 'number', max: 100 }, 'key', { key: 101 }))
        .rejects.toThrow('key must be smaller or equal than 100')
    })

    it('should handle then min attribute', async () => {
      expect(await getModelAttribute({ type: 'number', min: 100 }, 'key', { key: 100 })).toBe(100)
      await expect(getModelAttribute({ type: 'number', min: 100 }, 'key', { key: 99 }))
        .rejects.toThrow('key must be larger or equal than 100')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'number', required: true }, 'key', { key: 0 })).toBe(0)
      expect(await getModelAttribute({ type: 'number', required: true }, 'key', { key: '0' })).toBe(0)
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', {}))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', { key: null }))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'number', default: 123 }, 'key', {})).toBe(123)
      expect(await getModelAttribute({ type: 'number', default: 123 }, 'key', { key: 987 })).toBe(987)
    })

    it('should throw an error if the value is not a number', async () => {
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', { key: 'wrong' }))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', { key: true }))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', { key: false }))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', { key: {} }))
        .rejects.toThrow('key must be a number')
    })
  })

  describe('Object', () => {
    it('should return the given object with all elements parsed', async () => {
      expect(await getModelAttribute({
        type: 'object',
        fields: {
          a: { type: 'string' },
          b: { type: 'boolean' },
          c: { type: 'number' },
        },
      }, 'key', { key: { a: 'test', b: 'true', c: '123' } })).toEqual({
        a: 'test',
        b: true,
        c: 123,
      })
    })

    it('should throw an error if onefield does not respect the constraints', async () => {
      expect(await getModelAttribute({
        type: 'object',
        fields: {
          a: { type: 'string' },
          b: { type: 'boolean' },
          c: { type: 'number', max: 10 },
        },
      }, 'key', { key: { a: 'test', b: 'true', c: '10' } })).toEqual({
        a: 'test',
        b: true,
        c: 10,
      })

      await expect(getModelAttribute({
        type: 'object',
        fields: {
          a: { type: 'string' },
          b: { type: 'boolean' },
          c: { type: 'number', max: 10 },
        },
      }, 'key', { key: { a: 'test', b: 'true', c: '11' } }))
        .rejects.toThrow('c must be smaller or equal than 10')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({
        type: 'object',
        required: true,
        fields: { a: { type: 'string' }, },
      }, 'key', { key: { a: 'test' } })).toEqual({ a: 'test' })

      await expect(getModelAttribute({
        type: 'object',
        required: true,
        fields: { a: { type: 'string' }, },
      }, 'key', {})).rejects.toThrow(/key is required/)
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({
        type: 'object',
        fields: { a: { type: 'string' }, },
        default: { a: 'default' },
      }, 'key', { key: { a: 'test' } })).toEqual({ a: 'test' })

      expect(await getModelAttribute({
        type: 'object',
        fields: { a: { type: 'string' }, },
        default: { a: 'default' },
      }, 'key', {})).toEqual({ a: 'default' })
    })

    it('should throw an error if the value is not an object', async () => {
      await expect(getModelAttribute({
        type: 'object',
        fields: { a: { type: 'string' }, },
      }, 'key', { key: 'not an object' })).rejects.toThrow(/key must be an object/)
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
      const res = await getModelAttribute({ type: 'ref', entity: entityName }, 'item', { item: itemId })
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)
    })

    it('should throw an error if value is not a valid ObjectId', async () => {
      await expect(getModelAttribute({ type: 'ref', entity: entityName }, 'item', { item: 'bad-id' }))
        .rejects.toThrow('item is not a valid ID')
    })

    it('should throw an error if the value does not reference to an existent resource', async () => {
      const objectId = new ObjectId()
      await expect(getModelAttribute({ type: 'ref', entity: entityName }, 'item', { item: objectId.toString() }))
        .rejects.toThrow('item not found')
    })

    it('should handle the required attribute', async () => {
      const res = await getModelAttribute({
        type: 'ref',
        entity: entityName,
        required: true
      }, 'item', { item: itemId })
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)

      await expect(getModelAttribute({ type: 'ref', entity: entityName, required: true }, 'item', {}))
        .rejects.toThrow('item is required')
    })

    it('should handle the default attribute', async () => {
      const res = await getModelAttribute({ type: 'ref', entity: entityName, default: itemId }, 'item', {})
      expect(res instanceof ObjectId).toBe(true)
      expect(res.toString()).toBe(itemId)
      const res2 = await getModelAttribute({
        type: 'ref',
        entity: entityName,
        default: new ObjectId().toString()
      }, 'item', { item: itemId })
      expect(res2 instanceof ObjectId).toBe(true)
      expect(res2.toString()).toBe(itemId)
    })
  })

  describe('Slug', () => {
    beforeEach(() => {
      SecurityUtils.generateRandomString = jest.fn((chars) => `RANDOM:${chars}`)
    })

    it('should return a slug string from the target', async () => {
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key', { title: 'Test Title', key: '' }))
        .toBe('test-title')
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key', { title: '  TEST  ', key: '' }))
        .toBe('test')
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key',
        { title: 'This is   @1   title?!', key: '' })
      ).toBe('this-is-1-title')
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key', {
        title: '---$ Test Title $---',
        key: ''
      }))
        .toBe('test-title')
    })

    it('should handle the prefix attribute', async () => {
      expect(await getModelAttribute({
        type: 'slug',
        setFrom: 'title',
        prefix: { type: 'random', chars: 8 }
      }, 'key', { title: 'test', key: '' })).toBe('RANDOM:8-test')
    })

    it('should handle the suffix attribute', async () => {
      expect(await getModelAttribute({
        type: 'slug',
        setFrom: 'title',
        suffix: { type: 'random', chars: 8 }
      }, 'key', { title: 'test', key: '' })).toBe('test-RANDOM:8')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title', required: true }, 'key', {
        title: 'test',
        key: ''
      })).toBe('test')
      await expect(getModelAttribute({ type: 'slug', setFrom: 'title', required: true }, 'key', {
        title: '',
        key: ''
      })).rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title', default: 'default' }, 'key', {}))
        .toBe('default')
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title', default: 'default' }, 'key', {
        title: 'test',
        key: ''
      })).toBe('test')
    })
  })

  describe('String', () => {
    it('should return the given string', async () => {
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: 'test' })).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: '123' })).toBe('123')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: 123 })).toBe('123')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: 0 })).toBe('0')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: true })).toBe('true')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: false })).toBe('false')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: '' })).toBe('')
      expect(await getModelAttribute({ type: 'string' }, 'key', {})).toBe(undefined)
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: null })).toBe(undefined)
    })

    it('should return the given string trimmed', async () => {
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: 'test  ' })).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: '  test' })).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', { key: '  test  ' })).toBe('test')
    })

    it('should handle the maxLength attribute', async () => {
      expect(await getModelAttribute({ type: 'string', maxLength: 4 }, 'key', { key: 'test' }))
        .toBe('test')
      expect(await getModelAttribute({ type: 'string', maxLength: 4 }, 'key', { key: 'test    ' }))
        .toBe('test')
      await expect(getModelAttribute({ type: 'string', maxLength: 3 }, 'key', { key: 'test' }))
        .rejects.toThrow('key must be shorter than 3 characters')
    })

    it('should handle the validRegex attribute', async () => {
      expect(await getModelAttribute({ type: 'string', validRegex: '^[a-z]*$' }, 'key', { key: 'test' }))
        .toBe('test')
      await expect(getModelAttribute({ type: 'string', validRegex: '^[a-z]*$' }, 'key', { key: 'Test' }))
        .rejects.toThrow('key contains invalid characters')

      expect(await getModelAttribute({ type: 'string', validRegex: '^[a-zA-Z]*$' }, 'key', { key: 'Test' }))
        .toBe('Test')
      await expect(getModelAttribute({ type: 'string', validRegex: '^[a-zA-Z]*$' }, 'key', { key: 'Test 1' }))
        .rejects.toThrow('key contains invalid characters')

      expect(await getModelAttribute({ type: 'string', validRegex: '^[a-z0-9\\s]*$' }, 'key', { key: 'test 123' }))
        .toBe('test 123')
      await expect(getModelAttribute({ type: 'string', validRegex: '^[a-z0-9\\s]*$' }, 'key', { key: 'test @1' }))
        .rejects.toThrow('key contains invalid characters')
    })

    it('should handle the hash attribute', async () => {
      SecurityUtils.hashWithBcrypt = jest
        .fn(async (str: string, saltRounds: number) => `hashed_${str}_${saltRounds}`)

      expect(await getModelAttribute({
        type: 'string',
        hash: { algorithm: 'bcrypt', salt_rounds: 12 }
      }, 'key', { key: 'test' }))
        .toBe('hashed_test_12')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'string', required: true }, 'key', { key: 'test' })).toBe('test')
      expect(await getModelAttribute({ type: 'string', required: true }, 'key', { key: 0 })).toBe('0')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', { key: '' }))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', { key: null }))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', {}))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', { key: '    ' }))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'string', default: 'test' }, 'key', {})).toBe('test')
      expect(await getModelAttribute({ type: 'string', default: 'test' }, 'key', { key: 'aaa' })).toBe('aaa')
    })
  })

  describe('User', () => {
    const userId = new ObjectId()

    it('should return an ObjectId with the user id or undefined', async () => {
      expect(await getModelAttribute({ type: 'user' }, 'key', {}, userId.toString()))
        .toEqual(userId)
      expect(await getModelAttribute({ type: 'user' }, 'key', {})).toBeUndefined()
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'user', required: true }, 'key', {}, userId.toString()))
        .toEqual(userId)
      await expect(getModelAttribute({ type: 'user', required: true }, 'key', {}))
        .rejects.toThrow('key is required')
    })

    it('should handle the default attribute', async () => {
      expect(await getModelAttribute({ type: 'user', default: userId.toString() }, 'key', {}))
        .toEqual(userId)
      expect(await getModelAttribute({
        type: 'user',
        default: new ObjectId().toString()
      }, 'key', {}, userId.toString())).toEqual(userId)
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
