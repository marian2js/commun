import { EntityConfig, EntityModel, JoinAttribute, ModelAttribute } from '@commun/core'
import { request } from '../utils/apiUtils'

export const EntityService = {
  async getEntities (): Promise<{ items: EntityConfig<EntityModel>[] }> {
    return request('GET', '/admin/entities')
  },

  async getEntity (entityName: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('GET', `/admin/entities/${entityName}`)
  },

  async updateEntity<T extends EntityModel> (entityName: string, data: { [key in keyof EntityConfig<T>]?: any }): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}`, data)
  },

  async updateEntityAttribute (entityName: string, attributeKey: string, attribute: ModelAttribute): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}/attributes/${attributeKey}`, attribute)
  },

  async deleteEntityAttribute (entityName: string, attributeKey: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('DELETE', `/admin/entities/${entityName}/attributes/${attributeKey}`)
  },

  async updateEntityJoinAttribute (entityName: string, attributeKey: string, attribute: JoinAttribute): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}/joinAttributes/${attributeKey}`, attribute)
  },

  async deleteEntityJoinAttribute (entityName: string, attributeKey: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('DELETE', `/admin/entities/${entityName}/joinAttributes/${attributeKey}`)
  },
}
