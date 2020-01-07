export type EntityPermission = 'public' | 'auth_user' | 'user_is_author' | 'admin' | 'nobody'

export type EntityActionPermissions = {
  get?: EntityPermission | EntityPermission[]
  create?: EntityPermission | EntityPermission[]
  update?: EntityPermission | EntityPermission[]
  delete?: EntityPermission | EntityPermission[]
}