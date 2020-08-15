export type EntityPermission = 'anyone' | 'user' | 'own' | 'admin' | 'system'

export type EntityActionPermissions = {
  get?: EntityPermission | EntityPermission[]
  create?: EntityPermission | EntityPermission[]
  update?: EntityPermission | EntityPermission[]
  delete?: EntityPermission | EntityPermission[]

  properties?: {
    [key: string]: EntityActionPermissions
  }
}
