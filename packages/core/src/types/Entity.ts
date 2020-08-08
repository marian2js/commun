import { EntityModel } from './EntityModel'
import { EntityConfig } from './EntityConfig'
import { EntityController, EntityDao } from '..'
import { Module } from './Module'
import { EntityCodeHooks } from './EntityCodeHooks'

interface RegisterEntityRequiredProps<MODEL extends EntityModel> {
  config: EntityConfig<MODEL>
}

export interface Entity<MODEL extends EntityModel> extends Module, RegisterEntityRequiredProps<MODEL> {
  dao: EntityDao<MODEL>
  controller: EntityController<MODEL>
  codeHooks?: EntityCodeHooks
}

export type RegisterEntityOptions<MODEL extends EntityModel> =
  RegisterEntityRequiredProps<MODEL>
  & Partial<Entity<MODEL>>
