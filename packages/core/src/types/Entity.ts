import express from 'express'
import { EntityModel } from './EntityModel'
import { EntityConfig } from './EntityConfig'
import { EntityController } from '..'
import { EntityDao } from '../dao/EntityDao'

export interface Entity<MODEL extends EntityModel> {
  config: EntityConfig<MODEL>
  dao: EntityDao<MODEL>
  controller: EntityController<MODEL>
  router?: express.Router
}

export type RegisterEntityOptions<MODEL extends EntityModel> = {
  config: EntityConfig<MODEL>
  dao?: EntityDao<MODEL>
  controller?: EntityController<MODEL>
  router?: express.Router
}
