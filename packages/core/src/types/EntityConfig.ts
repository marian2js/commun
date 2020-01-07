import { BaseEntity } from './BaseEntity'
import { EntityActionPermissions } from './EntityPermission'
import { EntityAttribute } from './EntityAttribute'

export interface EntityConfig<T extends BaseEntity> {
  entityName: string
  collectionName: string
  permissions?: EntityActionPermissions
  attributes: {
    [key in keyof T]: EntityAttribute
  }
}
