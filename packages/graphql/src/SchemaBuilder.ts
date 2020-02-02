import { assertNever, Commun, EntityActionPermissions, EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import {
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLResolveInfo,
  Thunk
} from 'graphql/type/definition'
import graphqlFields from 'graphql-fields'
import { GraphQLController } from './controllers/GraphQLController'
import { capitalize } from './utils/StringUtils'

const entityObjectTypesCache: { [key: string]: GraphQLObjectType } = {}

export function createGraphQLSchema (): GraphQLSchema {
  const queryConfig: any = {
    name: 'query',
    fields: {}
  }
  const mutationConfig: any = {
    name: 'mutation',
    fields: {}
  }

  for (const entity of Object.values(Commun.getEntities())) {
    const entityType = buildEntityObjectType(entity.config)
    const createEntityInput = buildEntityInputType(entity.config, 'create')
    const updateEntityInput = buildEntityInputType(entity.config, 'update')
    const deleteEntityInput = buildEntityInputType(entity.config, 'delete')

    queryConfig.fields[entity.config.entityName] = GraphQLController.listEntities(entity, entityType)
    queryConfig.fields[entity.config.entitySingularName!] = GraphQLController.getEntity(entity, entityType)
    mutationConfig.fields[`create${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.createEntity(entity, entityType, createEntityInput)
    mutationConfig.fields[`update${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.updateEntity(entity, entityType, updateEntityInput)
    mutationConfig.fields[`delete${capitalize(entity.config.entitySingularName!)}`] =
      GraphQLController.deleteEntity(entity, entityType, deleteEntityInput)
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

  for (const [key, attribute] of Object.entries(entityConfig.attributes)) {
    const hasSystemOnlyPermission = attribute!.permissions?.get === 'system' ||
      (!attribute!.permissions?.get && entityConfig.permissions?.get === 'system')

    if (!hasSystemOnlyPermission) {
      const type = getAttributeGraphQLType(entityConfig, attribute!, 'type') as GraphQLOutputType
      fields[key] = {
        type: attribute!.required || key === '_id' ? new GraphQLNonNull(type) : type,
        resolve: getAttributeGraphQLResolver(entityConfig, attribute!)
      }
    }
  }

  return entityObjectTypesCache[entityConfig.entityName] = new GraphQLObjectType({
    name: capitalize(entityConfig.entitySingularName!),
    fields: () => fields,
  })
}

function buildEntityInputType (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const fields: Thunk<GraphQLInputFieldConfigMap> = {}
  const apiKey = entityConfig.apiKey || '_id'

  // apiKey should always be the first attribute
  const attributes = Object.entries(entityConfig.attributes)
    .sort(([key]) => key === apiKey ? -1 : 1)

  for (const [key, attribute] of attributes) {
    if (action === 'create' && key === '_id') {
      continue
    }
    if (action === 'update' && apiKey !== '_id' && key === '_id') {
      continue
    }
    if (action === 'delete' && key !== apiKey) {
      continue
    }

    const isIdentificationKey = ['update', 'delete'].includes(action) && key === apiKey

    const hasSystemOnlyPermission = attribute!.permissions?.[action] === 'system' ||
      (!attribute!.permissions?.[action] && entityConfig.permissions?.[action] === 'system')

    if (!hasSystemOnlyPermission || isIdentificationKey) {
      const type = getAttributeGraphQLType(entityConfig, attribute!, 'input') as GraphQLInputType
      const attributeRequired = attribute!.required || key === '_id' || isIdentificationKey
      fields[key] = {
        type: attributeRequired ? new GraphQLNonNull(type) : type,
      }
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

function getAttributeGraphQLType (
  entityConfig: EntityConfig<EntityModel>,
  attribute: ModelAttribute,
  kind: 'type' | 'input'
): GraphQLInputType | GraphQLOutputType {
  switch (attribute.type) {
    case 'boolean':
      return GraphQLBoolean
    case 'email':
    case 'slug':
    case 'string':
      return GraphQLString
    case 'id':
      return GraphQLID
    case 'number':
      return GraphQLInt

    case 'ref':
    case 'user':
      if (attribute.type === 'user' && entityConfig.entityName === 'users') {
        return GraphQLID
      }
      const entityName = attribute.type === 'ref' ? attribute.entity : 'users'
      return kind === 'type' ?
        buildEntityObjectType(Commun.getEntity(entityName).config) : GraphQLID

    // TODO support these fields
    case 'list':
    case 'map':
    case 'enum':
      return GraphQLString

    default:
      assertNever(attribute)
  }
}

function getAttributeGraphQLResolver (entityConfig: EntityConfig<EntityModel>, attribute: ModelAttribute) {
  if (attribute.type === 'user' && entityConfig.entityName === 'users') {
    return
  }
  if (['user', 'ref'].includes(attribute.type)) {
    const entityName = attribute.type === 'ref' ? attribute.entity : 'users'
    return async (source: any, args: any, context: any, info: GraphQLResolveInfo) => {
      const requestedKeys = graphqlFields(info)
      if (Object.keys(requestedKeys).filter(key => key !== '_id').length) {
        context.params = {
          id: source[info.fieldName]._id
        }
        const res = await Commun.getEntityController(entityName).get(context, { findModelById: true })
        return res.item
      }
      return source[info.fieldName]
    }
  }
}
