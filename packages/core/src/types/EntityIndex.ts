import { EntityModel } from './EntityModel'

export interface EntityIndex<MODEL extends EntityModel> {
  keys: {
    [key in keyof MODEL]?: 1 | -1
  }
  unique?: boolean
  sparse?: boolean
  v?: number
  expireAfterSeconds?: number
  name?: string
  default_language?: string
}
