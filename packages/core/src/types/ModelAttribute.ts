import { EntityActionPermissions } from './EntityPermission'

type BaseModelAttribute = {
  required?: boolean
  unique?: boolean
  permissions?: EntityActionPermissions
}

export type BooleanModelAttribute = BaseModelAttribute & {
  type: 'boolean'
}

export type EmailModelAttribute = BaseModelAttribute & {
  type: 'email'
}

export type NumberModelAttribute = BaseModelAttribute & {
  type: 'number'
  min?: number
  max?: number
}

export type StringModelAttribute = BaseModelAttribute & {
  type: 'string'
  maxLength?: number
  hash?: {
    algorithm: 'bcrypt',
    salt_rounds: number,
  }
}

export type ModelAttribute =
  BooleanModelAttribute |
  EmailModelAttribute |
  NumberModelAttribute |
  StringModelAttribute
