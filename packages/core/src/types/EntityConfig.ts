import { EntityModel } from './EntityModel'
import { EntityActionPermissions } from './EntityPermission'
import { ModelAttribute } from './ModelAttribute'

export interface EntityConfig<MODEL extends EntityModel> {
  entityName: string
  collectionName: string
  apiKey?: string
  permissions?: EntityActionPermissions
  attributes: {
    [key in keyof MODEL]: ModelAttribute
  }
}
