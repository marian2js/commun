import { FindManyJoinAttribute, FindOneJoinAttribute, JoinAttribute, JoinAttributeQuery } from '../types/JoinAttributes'
import { parseConfigString } from './configVariables'
import { Commun } from '../Commun'
import { assertNever, DaoFilter } from '..'

export async function getJoinAttribute<T> (attribute: JoinAttribute, model: T, userId?: string) {
  switch (attribute.type) {
    case 'findOne':
      return getFindOneJoinAttribute(attribute, model, userId)
    case 'findMany':
      return getFindManyJoinAttribute(attribute, model, userId)
    default:
      assertNever(attribute)
  }
}

async function getFindOneJoinAttribute<T> (attribute: FindOneJoinAttribute, model: T, userId?: string) {
  const filter = await getDaoFilter(attribute.query, attribute.entity, model, userId)
  return await Commun.getEntityDao(attribute.entity).findOne(filter)
}

async function getFindManyJoinAttribute<T> (attribute: FindManyJoinAttribute, model: T, userId?: string) {
  const filter = await getDaoFilter(attribute.query, attribute.entity, model, userId)
  return await Commun.getEntityDao(attribute.entity).find(filter)
}

async function getDaoFilter<T> (query: JoinAttributeQuery, entityName: string, model: T, userId?: string) {
  const filter: DaoFilter<T> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key as keyof T] = typeof value === 'string' ? await parseConfigString(value, entityName, model, userId) : value
  }
  return filter
}
