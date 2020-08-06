import { assertNever, Commun, EntityActionPermissions, EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInputType,
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
import { GraphQLJSONObject } from 'graphql-type-json'
import { GraphQLController } from './controllers/GraphQLController'
import { capitalize } from './utils/StringUtils'
import { GraphQLUserController } from './controllers/GraphQLUserController'
import { GraphQLDate } from './graphql-types/GraphQLDate'

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

  const fields: Thunk<GraphQLFieldConfigMap<any, any, any>> = {}

  // create the GraphQL object and cache it before setting the fields, to support circular references
  entityObjectTypesCache[entityConfig.entityName] = new GraphQLObjectType({
    name: capitalize(entityConfig.entitySingularName!),
    fields: () => fields,
    interfaces: [nodeInterface],
    description: `A single ${capitalize(entityConfig.entitySingularName!)}.`
  })

  for (const [key, attribute] of getEntityAttributesByAction(entityConfig, 'get')) {
    const type = getAttributeGraphQLType(
      entityConfig,
      key,
      attribute!,
      'type',
      name => capitalize(entityConfig.entitySingularName!) + name
    ) as GraphQLOutputType
    const permission = { ...entityConfig.permissions, ...attribute!.permissions }['get']
    const hasAnyoneAccess = Array.isArray(permission) ? permission.includes('anyone') : permission === 'anyone'
    const required = attribute!.required && (hasAnyoneAccess || ['ref', 'user'].includes(attribute!.type))

    fields[key] = {
      type: key === 'id' || required ? new GraphQLNonNull(type) : type,
      resolve: getAttributeGraphQLResolver(attribute!, entityConfig)
    }
  }

  for (const [key, joinAttribute] of Object.entries(entityConfig.joinAttributes || {})) {
    const entityType = buildEntityObjectType(Commun.getEntity(joinAttribute.entity).config)
    switch (joinAttribute.type) {
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
        assertNever(joinAttribute)
    }
  }

  return entityObjectTypesCache[entityConfig.entityName]
}

function buildEntityInputType (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const fields: Thunk<GraphQLInputFieldConfigMap> = {}
  const apiKey = entityConfig.apiKey || 'id'

  for (const [key, attribute] of getEntityAttributesByAction(entityConfig, action)) {
    const type = getAttributeGraphQLType(
      entityConfig,
      key,
      attribute!,
      'input',
      name => capitalize(action) + capitalize(entityConfig.entitySingularName!) + name + 'Input',
    ) as GraphQLInputType
    let attributeRequired: boolean
    switch (action) {
      case 'get':
        attributeRequired = false
        break
      case 'create':
        attributeRequired = attribute!.required || false
        break
      case 'update':
      case 'delete':
        attributeRequired = key === apiKey
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

  for (const [key, attribute] of getEntityAttributesByAction(entityConfig, 'get')) {
    fields[key] = {
      type: new GraphQLInputObjectType({
        name: capitalize(entityConfig.entitySingularName!) + capitalize(key) + 'FilterInput',
        fields: {
          value: {
            type: new GraphQLNonNull(getAttributeGraphQLType(
              entityConfig,
              key,
              attribute!,
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

  for (const [key] of getEntityAttributesByAction(entityConfig, 'get')) {
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
  attributeKey: string,
  attribute: ModelAttribute,
  kind: 'type' | 'input',
  getName: (key: string) => string,
): GraphQLInputType | GraphQLOutputType {
  switch (attribute.type) {
    case 'boolean':
      return GraphQLBoolean
    case 'email':
    case 'eval':
    case 'slug':
    case 'string':
      return GraphQLString
    case 'date':
      return GraphQLDate
    case 'id':
      return GraphQLID
    case 'number':
      return GraphQLFloat

    case 'ref':
    case 'user':
      if (attribute.type === 'user' && entityConfig.entityName === 'users') {
        return GraphQLID
      }
      const entityName = attribute.type === 'ref' ? attribute.entity : 'users'
      return kind === 'type' ?
        buildEntityObjectType(Commun.getEntity(entityName).config) : GraphQLID

    case 'enum':
      const name = capitalize(entityConfig.entitySingularName!) + capitalize(attributeKey) + 'EnumValues'
      if (entityEnumsCache[name]) {
        return entityEnumsCache[name]
      }
      const values = attribute.values.reduce((prev: { [key: string]: any }, curr) => {
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
        name: capitalize(entityConfig.entitySingularName!) + capitalize(attributeKey) + 'Enum',
        values,
      })

    case 'object':
      const fields: { [key: string]: any } = {}
      for (const [fieldKey, fieldAttribute] of Object.entries(attribute.fields)) {
        fields[fieldKey] = {
          type: getAttributeGraphQLType(
            entityConfig,
            capitalize(attributeKey) + capitalize(fieldKey),
            fieldAttribute,
            kind,
            getName,
          )
        }
      }
      const graphQLType = kind === 'input' ? GraphQLInputObjectType : GraphQLObjectType
      return new graphQLType({
        name: getName(capitalize(attributeKey)),
        fields: () => fields,
      })

    case 'list':
      const listType = getAttributeGraphQLType(
        entityConfig,
        attributeKey,
        attribute.listType,
        kind,
        getName,
      )
      return new GraphQLList(listType)

    case 'map':
      return GraphQLJSONObject

    default:
      assertNever(attribute)
  }
}

function getAttributeGraphQLResolver (attribute: ModelAttribute, entityConfig?: EntityConfig<EntityModel>) {
  switch (attribute.type) {
    case 'user':
    case 'ref':
      if (attribute.type === 'user' && entityConfig?.entityName === 'users') {
        return
      }
      const entityName = attribute.type === 'ref' ? attribute.entity : 'users'
      return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
        const requestedKeys = graphqlFields(info)
        if (Object.keys(requestedKeys).filter(key => key !== 'id').length) {
          context.params = {
            id: source[info.fieldName].id || source[info.fieldName]
          }
          const res = await Commun.getEntityController(entityName).get(context, { findModelById: true })
          return res.item
        }
        return source[info.fieldName]
      }
    case 'list':
      return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
        return source[info.fieldName]?.map((item: any) =>
          getAttributeGraphQLResolver(attribute.listType)?.({ [info.fieldName]: item }, args, context, info)
        )
      }
    case 'object':
      return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
        const obj: { [key: string]: any } = {}
        for (const [key, value] of Object.entries(attribute.fields)) {
          if (source[info.fieldName][key]) {
            obj[key] = getAttributeGraphQLResolver(value)
              ?.({ [info.fieldName]: source[info.fieldName][key] }, args, context, info)
          }
        }
        return obj
      }
  }
}

function getEntityAttributesByAction (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const apiKey = entityConfig.apiKey || 'id'

  // apiKey should always be the first attribute
  return Object.entries(entityConfig.attributes)
    .sort(([key]) => key === apiKey ? -1 : 1)
    .filter(([key, attribute]) => {
      if (action === 'create' && key === 'id') {
        return false
      }
      if (action === 'update' && apiKey !== 'id' && key === 'id') {
        return false
      }
      if (action === 'delete' && key !== apiKey) {
        return false
      }

      // Slugs are auto-generated by the system and cannot be set
      if (action === 'create' && attribute!.type === 'slug') {
        return false
      }

      const hasSystemOnlyPermission = attribute!.permissions?.[action] === 'system' ||
        (!attribute!.permissions?.[action] && entityConfig.permissions?.[action] === 'system')
      const isIdentificationKey = ['update', 'delete'].includes(action) && key === apiKey

      return !hasSystemOnlyPermission || isIdentificationKey
    })
}
