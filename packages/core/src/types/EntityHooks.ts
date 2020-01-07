import { BaseEntity } from './BaseEntity'

type HookResponse = Promise<any> | void

export interface EntityHooks<ENTITY extends BaseEntity> {
  beforeCreate?: (entity: ENTITY) => HookResponse

  afterCreate?: (entity: ENTITY) => HookResponse

  beforeUpdate?: (entity: ENTITY) => HookResponse

  afterUpdate?: (entity: ENTITY) => HookResponse

  beforeDelete?: (entity: ENTITY) => HookResponse

  afterDelete?: (entity: ENTITY) => HookResponse
}
