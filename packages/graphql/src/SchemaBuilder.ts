import {
  assertNever,
  Commun,
  EntityActionPermissions,
  EntityConfig,
  EntityModel,
  getEntityRef,
  isEntityRef
} from '@commun/core'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import {
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLResolveInfo,
  Thunk
} from 'graphql/type/definition'
import graphqlFields from 'graphql-fields'
import { GraphQLController } from './controllers/GraphQLController'
import { capitalize } from './utils/StringUtils'
import { GraphQLUserController } from './controllers/GraphQLUserController'
import { GraphQLDate } from './graphql-types/GraphQLDate'
import { JSONSchema7 } from 'json-schema'
import { GraphQLJSONObject } from 'graphql-type-json'

const entityObjectTypesCache: { [key: string]: GraphQLObjectType } = {}
const entityFilterTypesCache: { [key: string]: GraphQLInputObjectType } = {}
const entityEnumsCache: { [key: string]: GraphQLEnumType } = {}

const nodeInterface = new GraphQLInterfaceType({
  name: 'Node',
  fields: {
    id: {
      type: GraphQLNonNull(GraphQLID)
    }
  },
  description: `An object with an ID.`
})

const filterComparatorSymbol = new GraphQLEnumType({
  name: 'FilterComparatorSymbol',
  values: {
    EQUAL: { value: '=' },
    NOT_EQUAL: { value: '!=' },
    GREATER_THAN: { value: '>' },
    GREATER_THAN_OR_EQUAL: { value: '>=' },
    LESS_THAN: { value: '<' },
    LESS_THAN_OR_EQUAL: { value: '<=' },
  },
  description: 'Specify how 2 values are going to be compared.'
})

const orderByDirectionType = new GraphQLEnumType({
  name: 'OrderByDirection',
  values: {
    DESC: { value: 'desc' },
    ASC: { value: 'asc' },
  },
  description: 'Specify the direction on which the items are going to be returned.'
})

export function createGraphQLSchema (): GraphQLSchema {
  const queryConfig: any = {
    name: 'Query',
    fields: {},
    description: 'The query root of the GraphQL interface.',
  }
  const mutationConfig: any = {
    name: 'Mutation',
    fields: {},
    description: 'The root query for implementing GraphQL mutations.',
  }

  for (const entity of Object.values(Commun.getEntities())) {
    const entityType = buildEntityObjectType(entity.config)
    const getEntityInput = buildEntityInputType(entity.config, 'get')
    const createEntityInput = buildEntityInputType(entity.config, 'create')
    const updateEntityInput = buildEntityInputType(entity.config, 'update')
    const deleteEntityInput = buildEntityInputType(entity.config, 'delete')
    const filterByEntityInput = buildFilterEntityInputType(entity.config)
    const orderByEntityInput = buildOrderByEntityInputType(entity.config)

    queryConfig.fields[entity.config.entityName] =
      GraphQLController.listEntities(entity, entityType, getEntityInput, filterByEntityInput, orderByEntityInput)
    queryConfig.fields[entity.config.entitySingularName!] =
      GraphQLController.getEntity(entity, entityType)
    mutationConfig.fields[`create${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.createEntity(entity, entityType, createEntityInput)
    mutationConfig.fields[`update${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.updateEntity(entity, entityType, updateEntityInput)
    mutationConfig.fields[`delete${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.deleteEntity(entity, entityType, deleteEntityInput)

    if (entity.config.entityName === 'users') {
      queryConfig.fields.viewer = GraphQLUserController.getViewer(entityType)
      queryConfig.fields.accessToken = GraphQLUserController.getAccessToken()
      mutationConfig.fields.login = GraphQLUserController.login(entityType)
      mutationConfig.fields.logout = GraphQLUserController.logout()
      mutationConfig.fields.verifyEmail = GraphQLUserController.verifyEmail()
      mutationConfig.fields.sendResetPasswordEmail = GraphQLUserController.sendResetPasswordEmail()
      mutationConfig.fields.resetPassword = GraphQLUserController.resetPassword()
      mutationConfig.fields.completeSocialAuthentication = GraphQLUserController.completeSocialAuthentication(entityType)
    }
  }

  const queryType = new GraphQLObjectType(queryConfig)
  const mutationType = new GraphQLObjectType(mutationConfig)

  return new GraphQLSchema({ query: queryType, mutation: mutationType })
}

function buildEntityObjectType (entityConfig: EntityConfig<EntityModel>): GraphQLObjectType {
  if (entityObjectTypesCache[entityConfig.entityName]) {
    return entityObjectTypesCache[entityConfig.entityName]
  }

  const fields: Thunk<GraphQLFieldConfigMap<any, any>> = {}

  // create the GraphQL object and cache it before setting the fields, to support circular references
  entityObjectTypesCache[entityConfig.entityName] = new GraphQLObjectType({
    name: capitalize(entityConfig.entitySingularName!),
    fields: () => fields,
    interfaces: [nodeInterface],
    description: `A single ${capitalize(entityConfig.entitySingularName!)}.`
  })

  for (const [key, property] of getEntityPropertiesByAction(entityConfig, 'get')) {
    if (typeof property === 'boolean') {
      continue
    }
    const type = getAttributeGraphQLType(
      entityConfig,
      key,
      property,
      'type',
      name => capitalize(entityConfig.entitySingularName!) + name
    ) as GraphQLOutputType
    const permission = entityConfig.permissions?.properties?.[key]?.get || entityConfig.permissions?.get
    const hasAnyoneAccess = Array.isArray(permission) ? permission.includes('anyone') : permission === 'anyone'
    const required = entityConfig.schema.required?.includes(key) && (hasAnyoneAccess || isEntityRef(property))

    fields[key] = {
      type: key === 'id' || required ? new GraphQLNonNull(type) : type,
      resolve: getAttributeGraphQLResolver(property!, entityConfig)
    }
  }

  for (const [key, joinProperty] of Object.entries(entityConfig.joinProperties || {})) {
    const entityType = buildEntityObjectType(Commun.getEntity(joinProperty.entity).config)
    switch (joinProperty.type) {
      case 'findOne':
        fields[key] = {
          type: entityType
        }
        break
      case 'findMany':
        fields[key] = {
          type: new GraphQLList(entityType)
        }
        break
      default:
        assertNever(joinProperty)
    }
  }

  return entityObjectTypesCache[entityConfig.entityName]
}

function buildEntityInputType (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const fields: Thunk<GraphQLInputFieldConfigMap> = {}
  const apiKey = entityConfig.apiKey || 'id'

  for (const [key, property] of getEntityPropertiesByAction(entityConfig, action)) {
    if (typeof property === 'boolean') {
      continue
    }
    const type = getAttributeGraphQLType(
      entityConfig,
      key,
      property,
      'input',
      name => capitalize(action) + capitalize(entityConfig.entitySingularName!) + name + 'Input',
    ) as GraphQLInputType
    let attributeRequired: boolean
    switch (action) {
      case 'get':
        attributeRequired = false
        break
      case 'create':
        attributeRequired = entityConfig.schema?.required?.includes(key) || false
        break
      case 'update':
      case 'delete':
        attributeRequired = key === apiKey
        break
      default:
        continue
    }

    fields[key] = {
      type: attributeRequired ? new GraphQLNonNull(type) : type,
    }
  }

  // Input Objects require at least one field
  if (!Object.keys(fields).length) {
    return
  }

  return new GraphQLInputObjectType({
    name: capitalize(action) + capitalize(entityConfig.entitySingularName!) + 'Input',
    fields: () => fields,
  })
}

function buildFilterEntityInputType (entityConfig: EntityConfig<EntityModel>) {
  if (entityFilterTypesCache[entityConfig.entityName]) {
    return entityFilterTypesCache[entityConfig.entityName]
  }

  const fields: Thunk<GraphQLInputFieldConfigMap> = {}

  for (const [key, property] of getEntityPropertiesByAction(entityConfig, 'get')) {
    if (typeof property === 'boolean') {
      continue
    }
    fields[key] = {
      type: new GraphQLInputObjectType({
        name: capitalize(entityConfig.entitySingularName!) + capitalize(key) + 'FilterInput',
        fields: {
          value: {
            type: new GraphQLNonNull(getAttributeGraphQLType(
              entityConfig,
              key,
              property,
              'input',
              name => capitalize(entityConfig.entitySingularName!) + capitalize(key) + name + 'FilterInput',
            ) as GraphQLInputType)
          },
          comparator: {
            type: filterComparatorSymbol
          }
        }
      })
    }
  }

  // Input Objects require at least one field
  if (!Object.keys(fields).length) {
    return
  }

  return entityFilterTypesCache[entityConfig.entityName] = new GraphQLInputObjectType({
    name: capitalize(entityConfig.entitySingularName!) + 'FilterInput',
    fields: () => ({
      ...fields,
      or: {
        type: new GraphQLList(entityFilterTypesCache[entityConfig.entityName])
      },
      and: {
        type: new GraphQLList(entityFilterTypesCache[entityConfig.entityName])
      }
    }),
  })
}

function buildOrderByEntityInputType (entityConfig: EntityConfig<EntityModel>) {
  const fields: Thunk<GraphQLInputFieldConfigMap> = {}

  for (const [key] of getEntityPropertiesByAction(entityConfig, 'get')) {
    fields[key] = {
      type: orderByDirectionType
    }
  }

  // Input Objects require at least one field
  if (!Object.keys(fields).length) {
    return
  }

  return new GraphQLInputObjectType({
    name: capitalize(entityConfig.entitySingularName!) + 'OrderByInput',
    fields: () => fields,
  })
}

export function getAttributeGraphQLType (
  entityConfig: EntityConfig<EntityModel>,
  propertyKey: string,
  property: JSONSchema7,
  kind: 'type' | 'input',
  getName: (key: string) => string,
): GraphQLInputType | GraphQLOutputType | undefined {
  if (property.format === 'id') {
    return GraphQLID
  }
  if (['date', 'time', 'date-time'].includes(property.format || '')) {
    return GraphQLDate
  }
  const refEntityName = getEntityRef(property)
  if (refEntityName) {
    return kind === 'type' ?
      buildEntityObjectType(Commun.getEntity(refEntityName).config) : GraphQLID
  }
  if (property.enum) {
    const name = capitalize(entityConfig.entitySingularName!) + capitalize(propertyKey) + 'EnumValues'
    if (entityEnumsCache[name]) {
      return entityEnumsCache[name]
    }
    const values = property.enum.reduce((prev: { [key: string]: any }, curr) => {
      let key = '' + curr
      if (typeof curr === 'number') {
        if (curr > 0) {
          key = `POSITIVE_${curr}`
        } else if (curr < 0) {
          key = `NEGATIVE_${Math.abs(curr)}`
        } else {
          key = 'ZERO'
        }
      } else if (typeof curr == 'string') {
        key = curr
          .replace(/[^_a-zA-Z0-9]/g, '')
          .replace(/^[^_a-zA-Z]/g, '')
      }
      prev[key] = { value: curr }
      return prev
    }, {})
    return entityEnumsCache[name] = new GraphQLEnumType({
      name: capitalize(entityConfig.entitySingularName!) + capitalize(propertyKey) + 'Enum',
      values,
    })
  }
  if (property.format?.startsWith('eval:')) {
    return GraphQLString
  }
  switch (property.type) {
    case 'boolean':
      return GraphQLBoolean
    case 'string':
      return GraphQLString
    case 'integer':
      return GraphQLInt
    case 'number':
      return GraphQLFloat

    case 'object':
      if (!property.properties || property.additionalProperties) {
        return GraphQLJSONObject
      }
      const fields: { [key: string]: any } = {}
      for (const [fieldKey, fieldProperty] of Object.entries(property.properties)) {
        if (typeof fieldProperty === 'boolean') {
          continue
        }
        fields[fieldKey] = {
          type: getAttributeGraphQLType(
            entityConfig,
            capitalize(propertyKey) + capitalize(fieldKey),
            fieldProperty,
            kind,
            getName,
          )
        }
      }
      const graphQLType = kind === 'input' ? GraphQLInputObjectType : GraphQLObjectType
      return new graphQLType({
        name: getName(capitalize(propertyKey)),
        fields: () => fields,
      })

    case 'array':
      if (typeof property.items === 'boolean') {
        return
      }
      if (Array.isArray(property.items)) { // TODO support arrays on JSON Schema items
        return
      }
      const listType = getAttributeGraphQLType(
        entityConfig,
        propertyKey,
        property.items as JSONSchema7,
        kind,
        getName,
      )
      return listType ? new GraphQLList(listType) : undefined

    case 'null':
      return

    default:
      throw new Error(`Unknown property type ${property.type}`)
  }
}

function getAttributeGraphQLResolver (property: JSONSchema7, entityConfig?: EntityConfig<EntityModel>) {
  // Resolve entity references
  const refEntityName = getEntityRef(property)
  if (refEntityName) {
    return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
      const requestedKeys = graphqlFields(info)
      if (!source[info.fieldName]) {
        return null
      }
      if (Object.keys(requestedKeys).filter(key => key !== 'id').length) {
        context.params = {
          id: source[info.fieldName]?.id || source[info.fieldName]
        }
        const res = await Commun.getEntityController(refEntityName).get(context, { findModelById: true })
        return res.item
      }
      return source[info.fieldName]
    }
  }

  switch (property.type) {
    case 'array':
      return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
        if (typeof property.items === 'boolean' || Array.isArray(property.items)) {
          return
        }
        return source[info.fieldName]?.map((item: any) =>
          getAttributeGraphQLResolver(property.items as JSONSchema7)?.({ [info.fieldName]: item }, args, context, info)
        )
      }
    case 'object':
      return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
        if (!property.properties) {
          return source[info.fieldName]
        }
        const obj: { [key: string]: any } = {}
        for (const [key, objectProperty] of Object.entries(property.properties)) {
          if (typeof objectProperty === 'boolean') {
            continue
          }
          if (source[info.fieldName][key]) {
            obj[key] = getAttributeGraphQLResolver(objectProperty)
              ?.({ [info.fieldName]: source[info.fieldName][key] }, args, context, info)
          }
        }
        return obj
      }
  }
}

function getEntityPropertiesByAction (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const apiKey = entityConfig.apiKey || 'id'

  // apiKey should always be the first property
  return Object.entries(entityConfig.schema.properties || {})
    .sort(([key]) => key === apiKey ? -1 : 1)
    .filter(([key, property]) => {
      if (typeof property === 'boolean') {
        return false
      }
      if (action === 'create' && key === 'id') {
        return false
      }
      if (action === 'update' && apiKey !== 'id' && key === 'id') {
        return false
      }
      if (action === 'delete' && key !== apiKey) {
        return false
      }

      // Eval formats are auto-generated by the system and cannot be set
      if (action === 'create' && property.format?.startsWith('eval:')) {
        return false
      }

      const permissions = {
        ...(entityConfig.permissions || {}),
        ...(entityConfig.permissions?.properties?.[key] || {}),
      }
      const isIdentificationKey = ['update', 'delete'].includes(action) && key === apiKey

      return permissions[action] !== 'system' || isIdentificationKey
    })
}
