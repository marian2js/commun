import { assertNever, Commun, EntityActionPermissions, EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import {
  GraphQLBoolean,
  GraphQLEnumType,
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
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLResolveInfo,
  Thunk
} from 'graphql/type/definition'
import graphqlFields from 'graphql-fields'
import { GraphQLController } from './controllers/GraphQLController'
import { capitalize } from './utils/StringUtils'

const entityObjectTypesCache: { [key: string]: GraphQLObjectType } = {}

const nodeInterface = new GraphQLInterfaceType({
  name: 'Node',
  fields: {
    _id: {
      type: GraphQLNonNull(GraphQLID)
    }
  },
})

const orderByDirectionType = new GraphQLEnumType({
  name: 'OrderByDirection',
  values: {
    DESC: { value: 'desc' },
    ASC: { value: 'asc' },
  }
})

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
    const orderByEntityInput = buildOrderByEntityInputType(entity.config)

    queryConfig.fields[entity.config.entityName] = GraphQLController.listEntities(entity, entityType, orderByEntityInput)
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

  for (const [key, attribute] of getEntityAttributesByAction(entityConfig, 'get')) {
    const type = getAttributeGraphQLType(entityConfig, attribute!, 'type') as GraphQLOutputType
    fields[key] = {
      type: attribute!.required || key === '_id' ? new GraphQLNonNull(type) : type,
      resolve: getAttributeGraphQLResolver(entityConfig, attribute!)
    }
  }

  return entityObjectTypesCache[entityConfig.entityName] = new GraphQLObjectType({
    name: capitalize(entityConfig.entitySingularName!),
    fields: () => fields,
    interfaces: [nodeInterface],
  })
}

function buildEntityInputType (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const fields: Thunk<GraphQLInputFieldConfigMap> = {}
  const apiKey = entityConfig.apiKey || '_id'

  for (const [key, attribute] of getEntityAttributesByAction(entityConfig, action)) {
    const isIdentificationKey = ['update', 'delete'].includes(action) && key === apiKey

    const type = getAttributeGraphQLType(entityConfig, attribute!, 'input') as GraphQLInputType
    const attributeRequired = (attribute!.required || key === '_id' || isIdentificationKey) && action !== 'get'
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
    name: 'OrderBy' + capitalize(entityConfig.entitySingularName!) + 'Input',
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
    case 'date':
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

function getEntityAttributesByAction (entityConfig: EntityConfig<EntityModel>, action: keyof EntityActionPermissions) {
  const apiKey = entityConfig.apiKey || '_id'

  // apiKey should always be the first attribute
  return Object.entries(entityConfig.attributes)
    .sort(([key]) => key === apiKey ? -1 : 1)
    .filter(([key, attribute]) => {
      if (action === 'create' && key === '_id') {
        return false
      }
      if (action === 'update' && apiKey !== '_id' && key === '_id') {
        return false
      }
      if (action === 'delete' && key !== apiKey) {
        return false
      }

      const hasSystemOnlyPermission = attribute!.permissions?.[action] === 'system' ||
        (!attribute!.permissions?.[action] && entityConfig.permissions?.[action] === 'system')
      const isIdentificationKey = ['update', 'delete'].includes(action) && key === apiKey

      return !hasSystemOnlyPermission || isIdentificationKey
    })
}
