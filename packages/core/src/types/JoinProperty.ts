import { JsonPrimitive } from './JsonPrimitive'
import { EntityActionPermissions } from './EntityPermission'

export type JoinPropertyQuery = { [key: string]: JsonPrimitive }

type BaseJoinProperty = {
  entity: string
  query: JoinPropertyQuery
  permissions?: EntityActionPermissions
}

export type FindOneJoinProperty = BaseJoinProperty & {
  type: 'findOne'
}

export type FindManyJoinProperty = BaseJoinProperty & {
  type: 'findMany'
}

export type JoinProperty =
  FindOneJoinProperty |
  FindManyJoinProperty
