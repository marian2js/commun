import {
  ModelAttribute,
  NumberModelAttribute,
  StringModelAttribute
} from '../types/ModelAttribute'
import { BadRequestError } from '../errors/BadRequestError'
import { assertNever } from '../utils/typescript'

export function getModelAttribute (attribute: ModelAttribute, key: string, value: any) {
  switch (attribute.type) {
    case 'number':
      return getNumberModelAttribute(attribute, key, value)
    case 'string':
      return getStringModelAttribute(attribute, key, value)
    default:
      assertNever(attribute)
  }
}

function getNumberModelAttribute (attribute: NumberModelAttribute, key: string, value: any) {
  if (attribute.required && [undefined, null].includes(value)) {
    throw new BadRequestError(`${key} is required`)
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
  if (attribute.required && [undefined, null, false, ''].includes(value && value.trim())) {
    throw new BadRequestError(`${key} is required`)
  }

  const parsedValue = value.toString().trim()
  if (attribute.maxLength !== undefined && parsedValue.length > attribute.maxLength) {
    throw new BadRequestError(`${key} must be shorter than ${attribute.maxLength} characters`)
  }
  return parsedValue
}
