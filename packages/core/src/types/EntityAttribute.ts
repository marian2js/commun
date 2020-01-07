import { EntityActionPermissions } from './EntityPermission'

type BaseEntityAttribute = {
  required?: boolean
  unique?: boolean
  permissions?: EntityActionPermissions
}

export type NumberEntityAttribute = BaseEntityAttribute & {
  type: 'number'
  min?: number
  max?: number
}

export type StringEntityAttribute = BaseEntityAttribute & {
  type: 'string'
  maxLength?: number
}

export type EntityAttribute =
  NumberEntityAttribute |
  StringEntityAttribute
