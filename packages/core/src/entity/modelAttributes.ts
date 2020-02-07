import {
  BooleanModelAttribute,
  DateModelAttribute,
  EmailModelAttribute,
  EnumModelAttribute,
  ListModelAttribute,
  MapModelAttribute,
  ModelAttribute,
  NumberModelAttribute,
  RefModelAttribute,
  SlugModelAttribute,
  StringModelAttribute,
  UserModelAttribute
} from '../types'
import { BadRequestError, NotFoundError } from '../errors'
import { assertNever, SecurityUtils } from '../utils'
import * as EmailValidator from 'email-validator'
import { ObjectId } from 'mongodb'
import { Commun } from '../Commun'

type ModelData<T> = { [P in keyof T]?: T[P] }

export async function getModelAttribute<T> (
  attribute: ModelAttribute,
  key: keyof T,
  data: ModelData<T>,
  userId?: string,
  ignoreDefault?: boolean): Promise<any> {

  const defaultValue = ignoreDefault ? undefined : attribute.default

  switch (attribute.type) {
    case 'boolean':
      return getBooleanModelAttribute(attribute, key, data[key], defaultValue)
    case 'date':
      return getDateModelAttribute(attribute, key, data[key], defaultValue)
    case 'email':
      return getEmailModelAttribute(attribute, key, data[key], defaultValue)
    case 'enum':
      return getEnumModelAttribute(attribute, key, data[key], defaultValue)
    case 'id':
      return
    case 'list':
      return getListModelAttribute(attribute, key, data[key], defaultValue, userId, ignoreDefault)
    case 'map':
      return getMapModelAttribute(attribute, key, data[key], defaultValue, userId, ignoreDefault)
    case 'number':
      return getNumberModelAttribute(attribute, key, data[key], defaultValue)
    case 'ref':
      return getRefModelAttribute(attribute, key, data[key], defaultValue)
    case 'slug':
      return getSlugModelAttribute(attribute, key, data, defaultValue)
    case 'string':
      return getStringModelAttribute(attribute, key, data[key], defaultValue)
    case 'user':
      return getUserModelAttribute(attribute, key, data[key], defaultValue, userId)
    default:
      assertNever(attribute)
  }
}

function getBooleanModelAttribute<T> (attribute: BooleanModelAttribute, key: keyof T, value: any, defaultValue: boolean) {
  if ([undefined, null].includes(value)) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  const validValues = [true, false, 'true', 'false']
  if (!validValues.includes(value)) {
    throw new BadRequestError(`${key} must be boolean`)
  }

  return parseModelAttribute(attribute, value)
}

function getDateModelAttribute<T> (attribute: DateModelAttribute, key: keyof T, value: any, defaultValue: boolean) {
  if (!value) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  const date = parseModelAttribute(attribute, value)
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${key} must be a date`)
  }

  return date
}

function getEmailModelAttribute<T> (attribute: EmailModelAttribute, key: keyof T, value: any, defaultValue: string) {
  if (!value) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  const email = value.trim()
  if (!EmailValidator.validate(email)) {
    throw new BadRequestError(`${key} is not a valid email address`)
  }
  return email
}

function getEnumModelAttribute<T> (attribute: EnumModelAttribute, key: keyof T, value: any, defaultValue: string) {
  if (!value) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }
  if (!attribute.values.includes(value)) {
    throw new BadRequestError(`${key} must be one of ${attribute.values.join(', ')}`)
  }
  return value
}

function getListModelAttribute<T> (attribute: ListModelAttribute, key: keyof T, values: any, defaultValue: number, userId?: string, ignoreDefault?: boolean) {
  if (!values) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  if (!Array.isArray(values)) {
    throw new BadRequestError(`${key} must be an array`)
  }

  if (attribute.maxItems !== undefined && values.length > attribute.maxItems) {
    throw new BadRequestError(`${key} can contain up to ${attribute.maxItems} items`)
  }

  return Promise.all(values.map(async (_, index) => {
    try {
      return await getModelAttribute(attribute.listType, index, values, userId, ignoreDefault)
    } catch (e) {
      throw new Error(`${key} index ${e.message}`)
    }
  }))
}

function getMapModelAttribute<T> (attribute: MapModelAttribute, key: keyof T, map: any, defaultValue: number, userId?: string, ignoreDefault?: boolean) {
  if (!map) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  if (typeof map !== 'object') {
    throw new BadRequestError(`${key} must be an object`)
  }

  return Object.entries(map).reduce(async (prev: { [key: string]: any } | Promise<{ [key: string]: any }>, curr) => {
    const prevObject = await prev
    try {
      const key = await getModelAttribute(attribute.keyType, 'key', { key: curr[0] }, userId, ignoreDefault)
      prevObject[key] = await getModelAttribute(attribute.valueType, curr[0], map, userId, ignoreDefault)
      return prev
    } catch (e) {
      throw new Error(`${key} ${e.message}`)
    }
  }, {})
}

function getNumberModelAttribute<T> (attribute: NumberModelAttribute, key: keyof T, value: any, defaultValue: number) {
  if ([undefined, null].includes(value)) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    return defaultValue
  }

  const parsedValue = Number(value)
  if ([true, false].includes(value) || Number.isNaN(parsedValue)) {
    throw new BadRequestError(`${key} must be a number`)
  }
  if (attribute.min !== undefined && parsedValue < attribute.min) {
    throw new BadRequestError(`${key} must be larger or equal than ${attribute.min}`)
  }
  if (attribute.max !== undefined && parsedValue > attribute.max) {
    throw new BadRequestError(`${key} must be smaller or equal than ${attribute.max}`)
  }
  return parsedValue
}

async function getRefModelAttribute<T> (attribute: RefModelAttribute, key: keyof T, value: any, defaultValue: string) {
  if (attribute.required && !value && defaultValue === undefined) {
    throw new BadRequestError(`${key} is required`)
  }
  if (!value) {
    return defaultValue ? parseModelAttribute(attribute, defaultValue) : undefined
  }
  if (!ObjectId.isValid(value)) {
    throw new BadRequestError(`${key} is not a valid ID`)
  }
  const item = await Commun.getEntityDao(attribute.entity).findOne({ id: new ObjectId(value) })
  if (!item) {
    throw new NotFoundError(`${key} not found`)
  }
  return parseModelAttribute(attribute, value)
}

async function getSlugModelAttribute<T> (attribute: SlugModelAttribute, key: keyof T, data: ModelData<T>, defaultValue: string) {
  const targetData = (data[attribute.setFrom as keyof T] || '') as string
  let slug: string = ''
  if (targetData) {
    slug = targetData.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
  }
  if (!slug) {
    slug = defaultValue
  }
  if (attribute.required && !slug && defaultValue === undefined) {
    throw new BadRequestError(`${key} is required`)
  }
  if (attribute.prefix?.type === 'random') {
    slug = (await SecurityUtils.generateRandomString(attribute.prefix.chars)) + '-' + slug
  }
  if (attribute.suffix?.type === 'random') {
    slug += '-' + (await SecurityUtils.generateRandomString(attribute.suffix.chars))
  }
  return slug
}

async function getStringModelAttribute<T> (attribute: StringModelAttribute, key: keyof T, value: any, defaultValue: string) {
  const parsedValue = value?.toString()?.trim()
  if ([undefined, null, ''].includes(parsedValue)) {
    if (attribute.required && defaultValue === undefined) {
      throw new BadRequestError(`${key} is required`)
    }
    if (defaultValue) {
      return defaultValue
    }
    return parsedValue === '' ? '' : undefined
  }

  if (attribute.maxLength !== undefined && parsedValue.length > attribute.maxLength) {
    throw new BadRequestError(`${key} must be shorter than ${attribute.maxLength} characters`)
  }

  if (attribute.hash) {
    switch (attribute.hash.algorithm) {
      case 'bcrypt':
        return await SecurityUtils.hashWithBcrypt(value, attribute.hash.salt_rounds)
      default:
        assertNever(attribute.hash.algorithm)
    }
  }

  return parsedValue
}

async function getUserModelAttribute<T> (attribute: UserModelAttribute, key: keyof T, value: any, defaultValue: string, userId?: string) {
  if (attribute.required && !userId && defaultValue === undefined) {
    throw new BadRequestError(`${key} is required`)
  }
  if (userId) {
    return parseModelAttribute(attribute, userId)
  }
  return defaultValue ? parseModelAttribute(attribute, defaultValue) : undefined
}

export function parseModelAttribute (attribute: ModelAttribute, value: any) {
  switch (attribute.type) {
    case 'boolean':
      return value === true || value === 'true'
    case 'string':
    case 'email':
    case 'slug':
      return '' + value
    case 'number':
      return Number(value)
    case 'date':
      return Number.isNaN(Number(value)) ? new Date(value) : new Date(Number(value))
    case 'id':
    case 'ref':
    case 'user':
      return new ObjectId(value)
    case 'enum':
      return attribute.values.includes(value) ? value : undefined
    case 'list':
      return value.map((valueItem: any) => parseModelAttribute(attribute.listType, valueItem))
    case 'map':
      return Object.entries(value).reduce((prev: { [key: string]: any }, curr) => {
        const key = parseModelAttribute(attribute.keyType, curr[0])
        prev[key] = parseModelAttribute(attribute.valueType, curr[1])
        return prev
      }, {})
    default:
      assertNever(attribute)
  }
}
