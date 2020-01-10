import {
  BooleanModelAttribute,
  EmailModelAttribute,
  ModelAttribute,
  NumberModelAttribute,
  StringModelAttribute,
  UserModelAttribute
} from '../types'
import { BadRequestError } from '../errors'
import { assertNever, SecurityUtils } from '../utils'
import * as EmailValidator from 'email-validator'
import { ObjectId } from 'mongodb'

export async function getModelAttribute<T> (attribute: ModelAttribute, key: keyof T, value: any, userId?: string) {
  switch (attribute.type) {
    case 'boolean':
      return getBooleanModelAttribute(attribute, key, value)
    case 'email':
      return getEmailModelAttribute(attribute, key, value)
    case 'number':
      return getNumberModelAttribute(attribute, key, value)
    case 'string':
      return getStringModelAttribute(attribute, key, value)
    case 'user':
      return getUserModelAttribute(attribute, key, value, userId)
    default:
      assertNever(attribute)
  }
}

function getBooleanModelAttribute<T> (attribute: BooleanModelAttribute, key: keyof T, value: any) {
  if ([undefined, null].includes(value)) {
    if (attribute.required) {
      throw new BadRequestError(`${key} is required`)
    }
    return undefined
  }

  const validValues = [true, false, 'true', 'false']
  if (!validValues.includes(value)) {
    throw new BadRequestError(`${key} must be boolean`)
  }
  return value === true || value === 'true'
}

function getEmailModelAttribute<T> (attribute: EmailModelAttribute, key: keyof T, value: any) {
  if (!value) {
    if (attribute.required) {
      throw new BadRequestError(`${key} is required`)
    }
    return undefined
  }

  const email = value.trim()
  if (!EmailValidator.validate(email)) {
    throw new BadRequestError(`${key} is not a valid email address`)
  }
  return email
}

function getNumberModelAttribute<T> (attribute: NumberModelAttribute, key: keyof T, value: any) {
  if ([undefined, null].includes(value)) {
    if (attribute.required) {
      throw new BadRequestError(`${key} is required`)
    }
    return undefined
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

async function getStringModelAttribute<T> (attribute: StringModelAttribute, key: keyof T, value: any) {
  const parsedValue = value !== null && value !== undefined ? value.toString().trim() : value
  if ([undefined, null, ''].includes(parsedValue)) {
    if (attribute.required) {
      throw new BadRequestError(`${key} is required`)
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

async function getUserModelAttribute<T> (attribute: UserModelAttribute, key: keyof T, value: any, userId?: string) {
  if (attribute.required && !userId) {
    throw new BadRequestError(`${key} is required`)
  }
  if (userId) {
    return new ObjectId(userId)
  }
}
