import { EntityConfig, EntityModel } from '@commun/core'
import { request } from '../utils/apiUtils'

export const EntityService = {
  async getEntities (): Promise<{ items: EntityConfig<EntityModel>[] }> {
    return request('GET', '/admin/entities')
  },

  async getEntity (entityName: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('GET', `/admin/entities/${entityName}`)
  },
}
