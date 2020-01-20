import { EntityModel } from './EntityModel'
import { EntityActionPermissions } from './EntityPermission'
import { ModelAttribute } from './ModelAttribute'
import { LifecycleEntityHooks } from './EntityHooks'
import { JoinAttribute } from './JoinAttributes'
import { EntityIndex } from './EntityIndex'

export interface EntityConfig<MODEL extends EntityModel> {
  entityName: string
  collectionName: string
  apiKey?: string
  permissions?: EntityActionPermissions
  attributes: {
    [key in keyof MODEL]: ModelAttribute
  }
  joinAttributes?: {
    [key: string]: JoinAttribute
  }
  indexes?: EntityIndex<MODEL>[]
  hooks?: LifecycleEntityHooks
}
