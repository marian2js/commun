import { EntityConfig, EntityModel, JoinProperty } from '@commun/core'
import { request, requestUntilSuccess } from '../utils/apiUtils'
import { JSONSchema7 } from 'json-schema'

export const EntityService = {
  async getEntities (): Promise<{ items: EntityConfig<EntityModel>[] }> {
    return request('GET', '/admin/entities')
  },

  async getEntity (entityName: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('GET', `/admin/entities/${entityName}`)
  },

  async createEntity (data: { entityName: string, addUser: boolean }): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('POST', `/admin/entities`, data)
  },

  async updateEntity<T extends EntityModel> (entityName: string, data: { [key in keyof EntityConfig<T>]?: any }): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}`, data)
  },

  async deleteEntity<T extends EntityModel> (entityName: string) {
    return request('DELETE', `/admin/entities/${entityName}`)
  },

  async updateEntityProperty (entityName: string, propertyKey: string, property: JSONSchema7, required?: boolean): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}/properties/${propertyKey}`, {
      ...property,
      required,
    })
  },

  async deleteEntityProperty (entityName: string, propertyKey: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('DELETE', `/admin/entities/${entityName}/properties/${propertyKey}`)
  },

  async updateEntityJoinProperty (entityName: string, propertyKey: string, joinProperty: JoinProperty): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('PUT', `/admin/entities/${entityName}/joinProperties/${propertyKey}`, joinProperty)
  },

  async deleteEntityJoinProperty (entityName: string, attributeKey: string): Promise<{ item: EntityConfig<EntityModel> }> {
    return request('DELETE', `/admin/entities/${entityName}/joinProperties/${attributeKey}`)
  },

  async waitUntilEntityExist (entityName: string) {
    return requestUntilSuccess({
      waitBetweenRetries: 500,
      maxRetries: 20
    }, 'GET', `/admin/entities/${entityName}`)
  }
}
