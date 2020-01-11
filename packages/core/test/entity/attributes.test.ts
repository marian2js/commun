import { getModelAttribute, parseModelAttribute } from '../../src'
import { SecurityUtils } from '../../src/utils'
import { ObjectId } from 'mongodb'

describe('attributes', () => {
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

    it('should throw an error if the value is not boolean', async () => {
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: 'str' }))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: 123 }))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', { key: {} }))
        .rejects.toThrow('key must be boolean')
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

  describe('String', () => {
    beforeEach(() => {
      SecurityUtils.generateRandomString = jest.fn((chars) => Promise.resolve(`RANDOM:${chars}`))
    })

    it('should return a slug string from the target', async () => {
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key', { title: 'Test Title', key: '' }))
        .toBe('test-title')
      expect(await getModelAttribute({ type: 'slug', setFrom: 'title' }, 'key', { title: '  TEST  ', key: '' }))
        .toBe('test')
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
  })

  describe('User', () => {
    const userId = new ObjectId()

    it('should return an ObjectId with the user id or undefined', async () => {
      expect(await getModelAttribute({ type: 'user' }, 'key', { key: 'test' }, userId.toString()))
        .toEqual(userId)
      expect(await getModelAttribute({ type: 'user' }, 'key', { key: 'test' })).toBeUndefined()
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'user', required: true }, 'key', { key: 'test' }, userId.toString()))
        .toEqual(userId)
      await expect(getModelAttribute({ type: 'user', required: true }, 'key', { key: 'test' }))
        .rejects.toThrow('key is required')
    })
  })
})

describe('parseModelAttribute', () => {
  it('should parse the value according the attribute type', async () => {
    expect(parseModelAttribute({ type: 'boolean' }, 'true')).toBe(true)
    expect(parseModelAttribute({ type: 'boolean' }, 'false')).toBe(false)
    expect(parseModelAttribute({ type: 'string' }, 'test')).toBe('test')
    expect(parseModelAttribute({ type: 'email' }, 'test@example.org')).toBe('test@example.org')
    expect(parseModelAttribute({ type: 'slug', setFrom: 'key' }, 'test')).toBe('test')
    expect(parseModelAttribute({ type: 'number' }, '123')).toBe(123)

    const userId = new ObjectId()
    expect(parseModelAttribute({ type: 'user' }, userId.toString())).toEqual(userId)
    expect(parseModelAttribute({ type: 'user' }, userId.toString()) instanceof ObjectId).toBe(true)
  })
})
