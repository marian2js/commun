import { FindManyJoinProperty, FindOneJoinProperty, JoinProperty, JoinPropertyQuery } from '../types'
import { parseConfigString } from './configVariables'
import { Commun } from '../Commun'
import { assertNever, DaoFilter } from '..'

export async function getJoinProperty<T> (property: JoinProperty, model: T, userId?: string) {
  switch (property.type) {
    case 'findOne':
      return getFindOneJoinProperty(property, model, userId)
    case 'findMany':
      return getFindManyJoinProperty(property, model, userId)
    default:
      assertNever(property)
  }
}

async function getFindOneJoinProperty<T> (property: FindOneJoinProperty, model: T, userId?: string) {
  const filter = await getDaoFilter(property.query, property.entity, model, userId)
  return await Commun.getEntityDao(property.entity).findOne(filter)
}

async function getFindManyJoinProperty<T> (property: FindManyJoinProperty, model: T, userId?: string) {
  const filter = await getDaoFilter(property.query, property.entity, model, userId)
  return await Commun.getEntityDao(property.entity).find(filter)
}

async function getDaoFilter<T> (query: JoinPropertyQuery, entityName: string, model: T, userId?: string) {
  const filter: DaoFilter<T> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key as keyof T] = typeof value === 'string' ? await parseConfigString(value, entityName, model, userId) : value
  }
  return filter
}
