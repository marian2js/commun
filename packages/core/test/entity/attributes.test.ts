import { getModelAttribute } from '../../src'
import { SecurityUtils } from '../../src/utils'
import { ObjectId } from 'mongodb'

describe('attributes', () => {
  describe('Boolean', () => {
    it('should return true for a truly value', async () => {
      expect(await getModelAttribute({ type: 'boolean' }, 'key', 'true')).toBe(true)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', true)).toBe(true)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', undefined)).toBe(undefined)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', null)).toBe(undefined)
    })

    it('should return false for a falsy value', async () => {
      expect(await getModelAttribute({ type: 'boolean' }, 'key', 'false')).toBe(false)
      expect(await getModelAttribute({ type: 'boolean' }, 'key', false)).toBe(false)
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', 'true')).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', true)).toBe(true)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', 'false')).toBe(false)
      expect(await getModelAttribute({ type: 'boolean', required: true }, 'key', false)).toBe(false)
      await expect(getModelAttribute({ type: 'boolean', required: true }, 'key', undefined))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'boolean', required: true }, 'key', null))
        .rejects.toThrow('key is required')
    })

    it('should throw an error if the value is not boolean', async () => {
      await expect(getModelAttribute({ type: 'boolean' }, 'key', 'str'))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', 123))
        .rejects.toThrow('key must be boolean')
      await expect(getModelAttribute({ type: 'boolean' }, 'key', {}))
        .rejects.toThrow('key must be boolean')
    })
  })

  describe('Email', () => {
    it('should return the given email', async () => {
      expect(await getModelAttribute({ type: 'email' }, 'key', 'email@example.org')).toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', 'email@s.example.org')).toBe('email@s.example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', 'a.b@example.org')).toBe('a.b@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', 'a.b@s.example.org')).toBe('a.b@s.example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', '')).toBe(undefined)
      expect(await getModelAttribute({ type: 'email' }, 'key', undefined)).toBe(undefined)
      expect(await getModelAttribute({ type: 'email' }, 'key', null)).toBe(undefined)
    })

    it('should return the email trimmed', async () => {
      expect(await getModelAttribute({ type: 'email' }, 'key', 'email@example.org   ')).toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', '   email@example.org')).toBe('email@example.org')
      expect(await getModelAttribute({ type: 'email' }, 'key', '   email@example.org   ')).toBe('email@example.org')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'email', required: true }, 'key', 'email@example.org'))
        .toBe('email@example.org')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', null))
        .rejects.toThrow('key is required')
    })

    it('should throw an error if the email is not valid', async () => {
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', 'email'))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', 'email@'))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', '@example.org'))
        .rejects.toThrow('key is not a valid email address')
      await expect(getModelAttribute({ type: 'email', required: true }, 'key', 'email@@example.org'))
        .rejects.toThrow('key is not a valid email address')
    })
  })

  describe('Number', () => {
    it('should return the given number', async () => {
      expect(await getModelAttribute({ type: 'number' }, 'key', 123)).toBe(123)
      expect(await getModelAttribute({ type: 'number' }, 'key', '123')).toBe(123)
      expect(await getModelAttribute({ type: 'number' }, 'key', 0)).toBe(0)
      expect(await getModelAttribute({ type: 'number' }, 'key', .5)).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', '.5')).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', '0.5')).toBe(.5)
      expect(await getModelAttribute({ type: 'number' }, 'key', undefined)).toBe(undefined)
      expect(await getModelAttribute({ type: 'number' }, 'key', null)).toBe(undefined)
    })

    it('should handle the max attribute', async () => {
      expect(await getModelAttribute({ type: 'number', max: 100 }, 'key', 100)).toBe(100)
      await expect(getModelAttribute({ type: 'number', max: 100 }, 'key', 101))
        .rejects.toThrow('key must be smaller or equal than 100')
    })

    it('should handle then min attribute', async () => {
      expect(await getModelAttribute({ type: 'number', min: 100 }, 'key', 100)).toBe(100)
      await expect(getModelAttribute({ type: 'number', min: 100 }, 'key', 99))
        .rejects.toThrow('key must be larger or equal than 100')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'number', required: true }, 'key', 0)).toBe(0)
      expect(await getModelAttribute({ type: 'number', required: true }, 'key', '0')).toBe(0)
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', undefined))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', null))
        .rejects.toThrow('key is required')
    })

    it('should throw an error if the value is not a number', async () => {
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', 'wrong'))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', true))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', false))
        .rejects.toThrow('key must be a number')
      await expect(getModelAttribute({ type: 'number', required: true }, 'key', {}))
        .rejects.toThrow('key must be a number')
    })
  })

  describe('String', () => {
    it('should return the given string', async () => {
      expect(await getModelAttribute({ type: 'string' }, 'key', 'test')).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', '123')).toBe('123')
      expect(await getModelAttribute({ type: 'string' }, 'key', 123)).toBe('123')
      expect(await getModelAttribute({ type: 'string' }, 'key', 0)).toBe('0')
      expect(await getModelAttribute({ type: 'string' }, 'key', true)).toBe('true')
      expect(await getModelAttribute({ type: 'string' }, 'key', false)).toBe('false')
      expect(await getModelAttribute({ type: 'string' }, 'key', '')).toBe('')
      expect(await getModelAttribute({ type: 'string' }, 'key', undefined)).toBe(undefined)
      expect(await getModelAttribute({ type: 'string' }, 'key', null)).toBe(undefined)
    })

    it('should return the given string trimmed', async () => {
      expect(await getModelAttribute({ type: 'string' }, 'key', 'test  ')).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', '  test')).toBe('test')
      expect(await getModelAttribute({ type: 'string' }, 'key', '  test  ')).toBe('test')
    })

    it('should handle the maxLength attribute', async () => {
      expect(await getModelAttribute({ type: 'string', maxLength: 4 }, 'key', 'test')).toBe('test')
      expect(await getModelAttribute({ type: 'string', maxLength: 4 }, 'key', 'test    ')).toBe('test')
      await expect(getModelAttribute({ type: 'string', maxLength: 3 }, 'key', 'test'))
        .rejects.toThrow('key must be shorter than 3 characters')
    })

    it('should handle the hash attribute', async () => {
      SecurityUtils.hashWithBcrypt = jest
        .fn(async (str: string, saltRounds: number) => `hashed_${str}_${saltRounds}`)

      expect(await getModelAttribute({ type: 'string', hash: { algorithm: 'bcrypt', salt_rounds: 12 } }, 'key', 'test'))
        .toBe('hashed_test_12')
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'string', required: true }, 'key', 'test')).toBe('test')
      expect(await getModelAttribute({ type: 'string', required: true }, 'key', 0)).toBe('0')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', ''))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', null))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', undefined))
        .rejects.toThrow('key is required')
      await expect(getModelAttribute({ type: 'string', required: true }, 'key', '    '))
        .rejects.toThrow('key is required')
    })
  })

  describe('User', () => {
    const userId = new ObjectId()

    it('should return an ObjectId with the user id or undefined', async () => {
      expect(await getModelAttribute({ type: 'user' }, 'key', 'test', userId.toString()))
        .toEqual(userId)
      expect(await getModelAttribute({ type: 'user' }, 'key', 'test')).toBeUndefined()
    })

    it('should handle the required attribute', async () => {
      expect(await getModelAttribute({ type: 'user', required: true }, 'key', 'test', userId.toString()))
        .toEqual(userId)
      await expect(getModelAttribute({ type: 'user', required: true }, 'key', 'test'))
        .rejects.toThrow('key is required')
    })
  })
})
