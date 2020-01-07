import { EntityActionPermissions } from './EntityPermission'

type BaseModelAttribute = {
  required?: boolean
  unique?: boolean
  permissions?: EntityActionPermissions
}

export type BooleanModelAttribute = BaseModelAttribute & {
  type: 'boolean'
}

export type NumberModelAttribute = BaseModelAttribute & {
  type: 'number'
  min?: number
  max?: number
}

export type StringModelAttribute = BaseModelAttribute & {
  type: 'string'
  maxLength?: number
}

export type ModelAttribute =
  BooleanModelAttribute |
  NumberModelAttribute |
  StringModelAttribute
