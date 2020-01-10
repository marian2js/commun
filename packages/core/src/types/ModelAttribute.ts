import { EntityActionPermissions } from './EntityPermission'

type BaseModelAttribute = {
  required?: boolean
  unique?: boolean
  index?: boolean
  readonly?: boolean
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

export type SlugModelAttribute = BaseModelAttribute & {
  type: 'slug'
  setFrom: string
  prefix?: {
    type: 'random'
    chars: number
  }
  suffix?: {
    type: 'random',
    chars: number
  }
}

export type StringModelAttribute = BaseModelAttribute & {
  type: 'string'
  maxLength?: number
  hash?: {
    algorithm: 'bcrypt',
    salt_rounds: number,
  }
}

export type UserModelAttribute = BaseModelAttribute & {
  type: 'user'
}

export type ModelAttribute =
  BooleanModelAttribute |
  EmailModelAttribute |
  NumberModelAttribute |
  SlugModelAttribute |
  StringModelAttribute |
  UserModelAttribute
