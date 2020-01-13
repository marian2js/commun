import { JsonPrimitive } from './JsonPrimitive'
import { EntityActionPermissions } from './EntityPermission'

export type JoinAttributeQuery = { [key: string]: JsonPrimitive }

type BaseJoinAttribute = {
  entity: string
  query: JoinAttributeQuery
  permissions?: EntityActionPermissions
}

export type FindOneJoinAttribute = BaseJoinAttribute & {
  type: 'findOne'
}

export type FindManyJoinAttribute = BaseJoinAttribute & {
  type: 'findMany'
}

export type JoinAttribute =
  FindOneJoinAttribute |
  FindManyJoinAttribute
