export type IncrementEntityHook = {
  action: 'increment',
  value: number | string
  target: string
}

export type SetEntityHook = {
  action: 'set',
  value: any
  target: string
}

export type EntityHook =
  IncrementEntityHook |
  SetEntityHook

export type EntityLifecycle =
  'beforeGet' |
  'afterGet' |
  'beforeCreate' |
  'afterCreate' |
  'beforeUpdate' |
  'afterUpdate' |
  'beforeDelete' |
  'afterDelete'
