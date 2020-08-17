import { JsonPrimitive } from './JsonPrimitive'

export type EntityHookCondition = {
  left: JsonPrimitive,
  right: JsonPrimitive,
  comparator: '=' | '>' | '<' | '>=' | '<=' | '!='
}

type BaseEntityHook = {
  condition?: EntityHookCondition
}

export type IncrementEntityHook = BaseEntityHook & {
  action: 'increment'
  value: number | string
  target: string
}

export type SetEntityHook = BaseEntityHook & {
  action: 'set'
  value: any
  target: string
}

export type EntityHook =
  IncrementEntityHook |
  SetEntityHook

export type LifecycleEntityHooks = {
  beforeGet?: EntityHook[]
  afterGet?: EntityHook[]
  beforeCreate?: EntityHook[]
  afterCreate?: EntityHook[]
  beforeUpdate?: EntityHook[]
  afterUpdate?: EntityHook[]
  beforeDelete?: EntityHook[]
  afterDelete?: EntityHook[]
}
