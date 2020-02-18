import { EntityModel } from './EntityModel'
import { EntityConfig } from './EntityConfig'
import { EntityController, EntityDao } from '..'
import { Module } from './Module'

interface RegisterEntityRequiredProps<MODEL extends EntityModel> {
  config: EntityConfig<MODEL>
}

export interface Entity<MODEL extends EntityModel> extends Module, RegisterEntityRequiredProps<MODEL> {
  dao: EntityDao<MODEL>
  controller: EntityController<MODEL>
}

export type RegisterEntityOptions<MODEL extends EntityModel> =
  RegisterEntityRequiredProps<MODEL>
  & Partial<Entity<MODEL>>
