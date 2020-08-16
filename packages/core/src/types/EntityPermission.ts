export type EntityPermission = 'anyone' | 'user' | 'own' | 'admin' | 'system'

export type EntityPropertyPermissions = {
  get?: EntityPermission | EntityPermission[]
  create?: EntityPermission | EntityPermission[]
  update?: EntityPermission | EntityPermission[]
  delete?: EntityPermission | EntityPermission[]
}

export type EntityActionPermissions = EntityPropertyPermissions & {
  properties?: {
    [key: string]: EntityPropertyPermissions
  }
}
