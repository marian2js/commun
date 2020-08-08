import { Request } from 'express'
import { EntityModel } from './EntityModel'

export type EntityCodeHook = (model: EntityModel, req: Request) => any

export type EntityCodeHooks = {
  beforeGet?: EntityCodeHook
  afterGet?: EntityCodeHook
  beforeCreate?: EntityCodeHook
  afterCreate?: EntityCodeHook
  beforeUpdate?: EntityCodeHook
  afterUpdate?: EntityCodeHook
  beforeDelete?: EntityCodeHook
  afterDelete?: EntityCodeHook
}
