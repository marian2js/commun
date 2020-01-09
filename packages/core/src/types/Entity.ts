import express, { Express } from 'express'
import { EntityModel } from './EntityModel'
import { EntityConfig } from './EntityConfig'
import { EntityController, EntityDao } from '..'

export interface Entity<MODEL extends EntityModel> {
  config: EntityConfig<MODEL>
  dao: EntityDao<MODEL>
  controller: EntityController<MODEL>
  router?: express.Router
  onExpressAppCreated?: (app: Express) => Promise<void> | void
}

export type RegisterEntityOptions<MODEL extends EntityModel> = {
  config: EntityConfig<MODEL>
  dao?: EntityDao<MODEL>
  controller?: EntityController<MODEL>
  router?: express.Router
  onExpressAppCreated?: (app: Express) => Promise<void> | void
}
