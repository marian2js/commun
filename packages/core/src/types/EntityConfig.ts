import { EntityModel } from './EntityModel'
import { EntityActionPermissions } from './EntityPermission'
import { ModelAttribute } from './ModelAttribute'
import { EntityHook } from './EntityHooks'

export interface EntityConfig<MODEL extends EntityModel> {
  entityName: string
  collectionName: string
  apiKey?: string
  permissions?: EntityActionPermissions
  attributes: {
    [key in keyof MODEL]: ModelAttribute
  }
  beforeGet?: EntityHook[]
  afterGet?: EntityHook[]
  beforeCreate?: EntityHook[]
  afterCreate?: EntityHook[]
  beforeUpdate?: EntityHook[]
  afterUpdate?: EntityHook[]
  beforeDelete?: EntityHook[]
  afterDelete?: EntityHook[]
}
