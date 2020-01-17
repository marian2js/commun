import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import { request } from '../utils/apiUtils'

export const EntityService = {
  async getEntities (): Promise<{ items: EntityConfig<EntityModel>[] }> {
    return request('GET', '/admin/entities')
  },

  async getEntity (entityName: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('GET', `/admin/entities/${entityName}`)
  },

  async updateEntity<T extends EntityModel> (entityName: string, data: { [key in keyof EntityConfig<T>]?: any }) {
    return request('PUT', `/admin/entities/${entityName}`, data)
  },

  async updateEntityAttribute (entityName: string, attributeKey: string, attribute: ModelAttribute) {
    return request('PUT', `/admin/entities/${entityName}/attributes/${attributeKey}`, attribute)
  },
}
