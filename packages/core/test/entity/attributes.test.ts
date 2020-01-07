import { getModelAttribute } from '../../src/entity/attributes'

describe('attributes', () => {
  describe('Boolean', () => {
    it('should return true for a truly value', async () => {
      expect(getModelAttribute({ type: 'boolean' }, 'key', 'true')).toBe(true)
      expect(getModelAttribute({ type: 'boolean' }, 'key', true)).toBe(true)
    })

    it('should return false for a falsy value', async () => {
      expect(getModelAttribute({ type: 'boolean' }, 'key', 'false')).toBe(false)
      expect(getModelAttribute({ type: 'boolean' }, 'key', false)).toBe(false)
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({ type: 'boolean', required: true }, 'key', 'true')).toBe(true)
      expect(getModelAttribute({ type: 'boolean', required: true }, 'key', true)).toBe(true)
      expect(getModelAttribute({ type: 'boolean', required: true }, 'key', 'false')).toBe(false)
      expect(getModelAttribute({ type: 'boolean', required: true }, 'key', false)).toBe(false)
      expect(() => getModelAttribute({ type: 'boolean', required: true }, 'key', undefined))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'boolean', required: true }, 'key', null))
        .toThrow('key is required')
    })

    it('should throw an error if the value is not boolean', async () => {
      expect(() => getModelAttribute({ type: 'boolean' }, 'key', 'str'))
        .toThrow('key must be boolean')
      expect(() => getModelAttribute({ type: 'boolean' }, 'key', 123))
        .toThrow('key must be boolean')
      expect(() => getModelAttribute({ type: 'boolean' }, 'key', {}))
        .toThrow('key must be boolean')
    })
  })

  describe('Email', () => {
    it('should return the given email', async () => {
      expect(getModelAttribute({ type: 'email' }, 'key', 'email@example.org')).toBe('email@example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', 'email@s.example.org')).toBe('email@s.example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', 'a.b@example.org')).toBe('a.b@example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', 'a.b@s.example.org')).toBe('a.b@s.example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', '')).toBe(undefined)
    })

    it('should return the email trimmed', async () => {
      expect(getModelAttribute({ type: 'email' }, 'key', 'email@example.org   ')).toBe('email@example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', '   email@example.org')).toBe('email@example.org')
      expect(getModelAttribute({ type: 'email' }, 'key', '   email@example.org   ')).toBe('email@example.org')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({ type: 'email', required: true }, 'key', 'email@example.org'))
        .toBe('email@example.org')
      expect(() => getModelAttribute({ type: 'email', required: true }, 'key', null))
        .toThrow('key is required')
    })

    it('should throw an error if the email is not valid', async () => {
      expect(() => getModelAttribute({ type: 'email', required: true }, 'key', 'email'))
        .toThrow('key is not a valid email address')
      expect(() => getModelAttribute({ type: 'email', required: true }, 'key', 'email@'))
        .toThrow('key is not a valid email address')
      expect(() => getModelAttribute({ type: 'email', required: true }, 'key', '@example.org'))
        .toThrow('key is not a valid email address')
      expect(() => getModelAttribute({ type: 'email', required: true }, 'key', 'email@@example.org'))
        .toThrow('key is not a valid email address')
    })
  })

  describe('Number', () => {
    it('should return the given number', async () => {
      expect(getModelAttribute({ type: 'number' }, 'key', 123)).toBe(123)
      expect(getModelAttribute({ type: 'number' }, 'key', '123')).toBe(123)
      expect(getModelAttribute({ type: 'number' }, 'key', 0)).toBe(0)
      expect(getModelAttribute({ type: 'number' }, 'key', .5)).toBe(.5)
      expect(getModelAttribute({ type: 'number' }, 'key', '.5')).toBe(.5)
      expect(getModelAttribute({ type: 'number' }, 'key', '0.5')).toBe(.5)
    })

    it('should handle the max attribute', async () => {
      expect(getModelAttribute({ type: 'number', max: 100 }, 'key', 100)).toBe(100)
      expect(() => getModelAttribute({ type: 'number', max: 100 }, 'key', 101))
        .toThrow('key must be smaller or equal than 100')
    })

    it('should handle then min attribute', async () => {
      expect(getModelAttribute({ type: 'number', min: 100 }, 'key', 100)).toBe(100)
      expect(() => getModelAttribute({ type: 'number', min: 100 }, 'key', 99))
        .toThrow('key must be larger or equal than 100')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({ type: 'number', required: true }, 'key', 0)).toBe(0)
      expect(getModelAttribute({ type: 'number', required: true }, 'key', '0')).toBe(0)
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', undefined))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', null))
        .toThrow('key is required')
    })

    it('should throw an error if the value is not a number', async () => {
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', 'wrong'))
        .toThrow('key must be a number')
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', true))
        .toThrow('key must be a number')
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', false))
        .toThrow('key must be a number')
      expect(() => getModelAttribute({ type: 'number', required: true }, 'key', {}))
        .toThrow('key must be a number')
    })
  })

  describe('String', () => {
    it('should return the given string', async () => {
      expect(getModelAttribute({ type: 'string' }, 'key', 'test')).toBe('test')
      expect(getModelAttribute({ type: 'string' }, 'key', '123')).toBe('123')
      expect(getModelAttribute({ type: 'string' }, 'key', 123)).toBe('123')
      expect(getModelAttribute({ type: 'string' }, 'key', 0)).toBe('0')
      expect(getModelAttribute({ type: 'string' }, 'key', true)).toBe('true')
      expect(getModelAttribute({ type: 'string' }, 'key', false)).toBe('false')
      expect(getModelAttribute({ type: 'string' }, 'key', '')).toBe('')
    })

    it('should return the given string trimmed', async () => {
      expect(getModelAttribute({ type: 'string' }, 'key', 'test  ')).toBe('test')
      expect(getModelAttribute({ type: 'string' }, 'key', '  test')).toBe('test')
      expect(getModelAttribute({ type: 'string' }, 'key', '  test  ')).toBe('test')
    })

    it('should handle the maxLength attribute', async () => {
      expect(getModelAttribute({ type: 'string', maxLength: 4 }, 'key', 'test')).toBe('test')
      expect(getModelAttribute({ type: 'string', maxLength: 4 }, 'key', 'test    ')).toBe('test')
      expect(() => getModelAttribute({ type: 'string', maxLength: 3 }, 'key', 'test'))
        .toThrow('key must be shorter than 3 characters')
    })

    it('should handle the required attribute', async () => {
      expect(getModelAttribute({ type: 'string', required: true }, 'key', 'test')).toBe('test')
      expect(getModelAttribute({ type: 'string', required: true }, 'key', 0)).toBe('0')
      expect(() => getModelAttribute({ type: 'string', required: true }, 'key', ''))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'string', required: true }, 'key', null))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'string', required: true }, 'key', undefined))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'string', required: true }, 'key', false))
        .toThrow('key is required')
      expect(() => getModelAttribute({ type: 'string', required: true }, 'key', '    '))
        .toThrow('key is required')
    })
  })
})
