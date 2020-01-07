import { EntityModel } from './EntityModel'

type HookResponse = Promise<any> | void

export interface EntityHooks<ENTITY extends EntityModel> {
  beforeCreate?: (entity: ENTITY) => HookResponse

  afterCreate?: (entity: ENTITY) => HookResponse

  beforeUpdate?: (entity: ENTITY) => HookResponse

  afterUpdate?: (entity: ENTITY) => HookResponse

  beforeDelete?: (entity: ENTITY) => HookResponse

  afterDelete?: (entity: ENTITY) => HookResponse
}
