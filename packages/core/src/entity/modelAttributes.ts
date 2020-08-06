import {
  BooleanModelAttribute,
  DateModelAttribute,
  EmailModelAttribute,
  EnumModelAttribute,
  EvalModelAttribute,
  ListModelAttribute,
  MapModelAttribute,
  ModelAttribute,
  NumberModelAttribute,
  ObjectModelAttribute,
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
import { parseConfigString } from './configVariables'

type ModelData<T> = { [P in keyof T]?: T[P] }

interface GetModelAttributeOptions<T> {
  entityName?: string
  attribute: ModelAttribute,
  key: keyof T,
  data: ModelData<T>
  userId?: string
  ignoreDefault?: boolean
}

interface GetModelAttributeTypeOptions<T, MODEL_ATTRIBUTE extends ModelAttribute>
  extends GetModelAttributeOptions<T> {
  attribute: MODEL_ATTRIBUTE
  value: any
  defaultValue: any
}

export function getModelAttribute<T> (options: GetModelAttributeOptions<T>): any {
  const typeOptions: GetModelAttributeTypeOptions<T, any> = {
    ...options,
    value: (options.data[options.key] as any),
    defaultValue: options.ignoreDefault ? undefined : options.attribute.default
  }

  switch (options.attribute.type) {
    case 'boolean':
      return getBooleanModelAttribute(typeOptions)
    case 'date':
      return getDateModelAttribute(typeOptions)
    case 'email':
      return getEmailModelAttribute(typeOptions)
    case 'enum':
      return getEnumModelAttribute(typeOptions)
    case 'eval':
      return getEvalModelAttribute(typeOptions)
    case 'id':
      return
    case 'list':
      return getListModelAttribute(typeOptions)
    case 'map':
      return getMapModelAttribute(typeOptions)
    case 'number':
      return getNumberModelAttribute(typeOptions)
    case 'object':
      return getObjectModelAttribute(typeOptions)
    case 'ref':
      return getRefModelAttribute(typeOptions)
    case 'slug':
      return getSlugModelAttribute(typeOptions)
    case 'string':
      return getStringModelAttribute(typeOptions)
    case 'user':
      return getUserModelAttribute(typeOptions)
    default:
      assertNever(options.attribute)
  }
}

function getBooleanModelAttribute<T> (options: GetModelAttributeTypeOptions<T, BooleanModelAttribute>) {
  if ([undefined, null].includes(options.value)) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  if (![true, false, 'true', 'false'].includes(options.value)) {
    throw new BadRequestError(`${options.key} must be boolean`)
  }

  return parseModelAttribute(options.attribute, options.value)
}

function getDateModelAttribute<T> (options: GetModelAttributeTypeOptions<T, DateModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  const date = parseModelAttribute(options.attribute, options.value)
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${options.key} must be a date`)
  }

  return date
}

function getEmailModelAttribute<T> (options: GetModelAttributeTypeOptions<T, EmailModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  const email = options.value.trim()
  if (!EmailValidator.validate(email)) {
    throw new BadRequestError(`${options.key} is not a valid email address`)
  }
  return email
}

function getEnumModelAttribute<T> (options: GetModelAttributeTypeOptions<T, EnumModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }
  if (!options.attribute.values.includes(options.value)) {
    throw new BadRequestError(`${options.key} must be one of ${options.attribute.values.join(', ')}`)
  }
  return options.value
}

async function getEvalModelAttribute<T> (options: GetModelAttributeTypeOptions<T, EvalModelAttribute>) {
  const parsedValue = await parseConfigString(options.attribute.eval, options.entityName || '', options.data, options.userId)
  if (!parsedValue) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }
  return parsedValue
}

function getListModelAttribute<T> (options: GetModelAttributeTypeOptions<T, ListModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  if (!Array.isArray(options.value)) {
    throw new BadRequestError(`${options.key} must be an array`)
  }

  if (options.attribute.maxItems !== undefined && options.value.length > options.attribute.maxItems) {
    throw new BadRequestError(`${options.key} can contain up to ${options.attribute.maxItems} items`)
  }

  return Promise.all(options.value.map(async (_, index) => {
    try {
      return await getModelAttribute({
        ...options,
        attribute: options.attribute.listType,
        key: index as keyof T,
        data: options.value,
      })
    } catch (e) {
      throw new Error(`${options.key} index ${e.message}`)
    }
  }))
}

function getMapModelAttribute<T> (options: GetModelAttributeTypeOptions<T, MapModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  if (typeof options.value !== 'object') {
    throw new BadRequestError(`${options.key} must be an object`)
  }

  return Object.entries(options.value).reduce(async (prev: { [key: string]: any } | Promise<{ [key: string]: any }>, curr) => {
    const prevObject = await prev
    try {
      const key = await getModelAttribute<{ key: any }>({
        ...options,
        attribute: options.attribute.keyType,
        key: 'key',
        data: { key: curr[0] },
      })
      prevObject[key] = await getModelAttribute({
        ...options,
        attribute: options.attribute.valueType,
        key: curr[0] as keyof T,
        data: options.value,
      })
      return prev
    } catch (e) {
      throw new Error(`${options.key} ${e.message}`)
    }
  }, {})
}

function getNumberModelAttribute<T> (options: GetModelAttributeTypeOptions<T, NumberModelAttribute>) {
  if ([undefined, null].includes(options.value)) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  }

  const parsedValue = Number(options.value)
  if ([true, false].includes(options.value) || Number.isNaN(parsedValue)) {
    throw new BadRequestError(`${options.key} must be a number`)
  }
  if (options.attribute.min !== undefined && parsedValue < options.attribute.min) {
    throw new BadRequestError(`${options.key} must be larger or equal than ${options.attribute.min}`)
  }
  if (options.attribute.max !== undefined && parsedValue > options.attribute.max) {
    throw new BadRequestError(`${options.key} must be smaller or equal than ${options.attribute.max}`)
  }
  return parsedValue
}

async function getObjectModelAttribute<T> (options: GetModelAttributeTypeOptions<T, ObjectModelAttribute>) {
  if (!options.value) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return options.defaultValue
  } else if (typeof options.value !== 'object') {
    throw new BadRequestError(`${options.key} must be an object`)
  }

  const obj: { [key: string]: any } = {}
  for (const [fieldKey, fieldAttribute] of Object.entries(options.attribute.fields)) {
    obj[fieldKey] = await getModelAttribute({
      ...options,
      attribute: fieldAttribute,
      key: fieldKey as keyof T,
      data: options.value,
      ignoreDefault: true,
    })
  }
  return obj
}

async function getRefModelAttribute<T> (options: GetModelAttributeTypeOptions<T, RefModelAttribute>) {
  if (options.attribute.required && !options.value && options.defaultValue === undefined) {
    throw new BadRequestError(`${options.key} is required`)
  }
  if (!options.value) {
    return options.defaultValue ? parseModelAttribute(options.attribute, options.defaultValue) : undefined
  }
  if (!ObjectId.isValid(options.value)) {
    throw new BadRequestError(`${options.key} is not a valid ID`)
  }
  const item = await Commun.getEntityDao(options.attribute.entity).findOne({ id: new ObjectId(options.value) })
  if (!item) {
    throw new NotFoundError(`${options.key} not found`)
  }
  return parseModelAttribute(options.attribute, options.value)
}

function getSlugModelAttribute<T> (options: GetModelAttributeTypeOptions<T, SlugModelAttribute>) {
  const targetData = (options.data[options.attribute.setFrom as keyof T] || '') as string
  let slug: string = ''
  if (targetData) {
    slug = targetData.toLowerCase()
      .replace(/-/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
  }
  if (!slug) {
    slug = options.defaultValue
  }
  if (options.attribute.required && !slug && options.defaultValue === undefined) {
    throw new BadRequestError(`${options.key} is required`)
  }
  if (options.attribute.prefix?.type === 'random') {
    slug = SecurityUtils.generateRandomString(options.attribute.prefix.chars) + '-' + slug
  }
  if (options.attribute.suffix?.type === 'random') {
    slug += '-' + SecurityUtils.generateRandomString(options.attribute.suffix.chars)
  }
  return slug
}

function getStringModelAttribute<T> (options: GetModelAttributeTypeOptions<T, StringModelAttribute>) {
  const parsedValue = options.value?.toString()?.trim()
  if ([undefined, null, ''].includes(parsedValue)) {
    if (options.attribute.required && options.defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    if (options.defaultValue) {
      return options.defaultValue
    }
    return parsedValue === '' ? '' : undefined
  }

  if (options.attribute.validRegex && !new RegExp(options.attribute.validRegex).test(parsedValue)) {
    throw new BadRequestError(`${options.key} contains invalid characters`)
  }

  if (options.attribute.maxLength !== undefined && parsedValue.length > options.attribute.maxLength) {
    throw new BadRequestError(`${options.key} must be shorter than ${options.attribute.maxLength} characters`)
  }

  if (options.attribute.hash) {
    switch (options.attribute.hash.algorithm) {
      case 'bcrypt':
        return SecurityUtils.hashWithBcrypt(options.value, options.attribute.hash.salt_rounds)
      default:
        assertNever(options.attribute.hash.algorithm)
    }
  }

  return parsedValue
}

function getUserModelAttribute<T> (options: GetModelAttributeTypeOptions<T, UserModelAttribute>) {
  if (options.attribute.required && !options.userId && options.defaultValue === undefined) {
    throw new BadRequestError(`${options.key} is required`)
  }
  if (options.userId) {
    return parseModelAttribute(options.attribute, options.userId)
  }
  return options.defaultValue ? parseModelAttribute(options.attribute, options.defaultValue) : undefined
}

export function parseModelAttribute (attribute: ModelAttribute, value: any) {
  switch (attribute.type) {
    case 'boolean':
      return value === true || value === 'true'
    case 'string':
    case 'email':
    case 'slug':
    case 'eval':
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
    case 'object':
      return Object.keys(attribute.fields).reduce((prev: { [key: string]: any }, curr) => {
        prev[curr] = parseModelAttribute(attribute.fields[curr], value[curr])
        return prev
      }, {})
    default:
      assertNever(attribute)
  }
}
