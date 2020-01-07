import {
  BooleanModelAttribute,
  EmailModelAttribute,
  ModelAttribute,
  NumberModelAttribute,
  StringModelAttribute
} from '../types/ModelAttribute'
import { BadRequestError } from '../errors/BadRequestError'
import { assertNever } from '../utils/typescript'
import * as EmailValidator from 'email-validator'

export function getModelAttribute (attribute: ModelAttribute, key: string, value: any) {
  switch (attribute.type) {
    case 'boolean':
      return getBooleanModelAttribute(attribute, key, value)
    case 'email':
      return getEmailModelAttribute(attribute, key, value)
    case 'number':
      return getNumberModelAttribute(attribute, key, value)
    case 'string':
      return getStringModelAttribute(attribute, key, value)
    default:
      assertNever(attribute)
  }
}

function getBooleanModelAttribute (attribute: BooleanModelAttribute, key: string, value: any) {
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

function getEmailModelAttribute (attribute: EmailModelAttribute, key: string, value: any) {
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

function getNumberModelAttribute (attribute: NumberModelAttribute, key: string, value: any) {
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

function getStringModelAttribute (attribute: StringModelAttribute, key: string, value: any) {
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
  return parsedValue
}
