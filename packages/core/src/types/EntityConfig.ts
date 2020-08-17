import { EntityModel } from './EntityModel'
import { EntityActionPermissions } from './EntityPermission'
import { LifecycleEntityHooks } from './EntityHooks'
import { JoinProperty } from './JoinProperty'
import { EntityIndex } from './EntityIndex'
import { JSONSchema7 } from 'json-schema'

export interface EntityConfig<MODEL extends EntityModel> {
  entityName: string
  entitySingularName?: string
  collectionName: string
  apiKey?: string
  permissions?: EntityActionPermissions
  schema: JSONSchema7
  joinProperties?: {
    [key: string]: JoinProperty
  }
  indexes?: EntityIndex<MODEL>[]
  hooks?: LifecycleEntityHooks
}
