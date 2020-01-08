export type RequiredKeys<T> = { [P in keyof T]: T[P] }

export type OptionalKeys<T> = { [P in keyof T]?: T[P] }
