import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql/type/definition'
import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { Request } from 'express'
import { Commun, Entity, EntityModel, UnauthorizedError } from '@commun/core'
import { capitalize } from '../utils/StringUtils'

export const GraphQLController = {
  listEntities (
    entity: Entity<EntityModel>,
    entityType: GraphQLObjectType,
    getEntityInput?: GraphQLInputObjectType,
    filterByEntityInput?: GraphQLInputObjectType,
    orderByEntityInput?: GraphQLInputObjectType
  ) {
    const args: any = {
      first: {
        type: GraphQLInt
      }
    }
    if (getEntityInput) {
      args.filter = {
        type: filterByEntityInput,
      }
    }
    if (orderByEntityInput) {
      args.orderBy = {
        type: new GraphQLList(orderByEntityInput),
      }
    }
    const supportsTextSearch = entity.config.indexes?.find(index => Object.values(index.keys).includes('text'))
    if (supportsTextSearch) {
      args.search = {
        type: GraphQLString
      }
    }

    return {
      type: new GraphQLObjectType({
        name: `List${capitalize(entity.config.entitySingularName!)}Payload`,
        fields: {
          nodes: {
            type: new GraphQLNonNull(new GraphQLList(entityType))
          }
        }
      }),
      args,
      resolve: async (parentValue: any, args: any, req: Request) => {
        req.query = args
        if (args.orderBy) {
          req.query.orderBy = args.orderBy
            .map((orderBy: { [key: string]: 'asc' | 'desc' }) => Object.entries(orderBy).map(entry => entry.join(':')).join(';'))
            .join(';')
        }
        const res = await entity.controller.list(req)
        return {
          nodes: res.items
        }
      },
      description: `Find ${capitalize(entity.config.entityName)}.`
    }
  },

  getEntity (entity: Entity<EntityModel>, entityType: GraphQLObjectType) {
    const apiKey = entity.config.apiKey || 'id'
    return {
      type: new GraphQLNonNull(entityType),
      args: {
        [apiKey]: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (_: any, args: any, req: Request) => {
        req.params = {
          id: args[apiKey]
        }
        const res = await entity.controller.get(req)
        return res.item
      },
      description: `Find a ${capitalize(entity.config.entitySingularName!)} by ${apiKey}.`,
    }
  },

  createEntity (entity: Entity<EntityModel>, entityType: GraphQLObjectType, entityInput?: GraphQLInputObjectType) {
    return {
      type: new GraphQLObjectType({
        name: `Create${capitalize(entity.config.entitySingularName!)}Payload`,
        fields: {
          [entity.config.entitySingularName!]: {
            type: entityType
          }
        }
      }),
      args: {
        ...(entityInput && { input: { type: entityInput } }),
      },
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args.input
        const res = await entity.controller.create(req)
        return {
          [entity.config.entitySingularName!]: res.item
        }
      },
      description: `Create a ${capitalize(entity.config.entitySingularName!)}.`
    }
  },

  updateEntity (entity: Entity<EntityModel>, entityType: GraphQLObjectType, entityInput?: GraphQLInputObjectType) {
    return {
      type: new GraphQLObjectType({
        name: `Update${capitalize(entity.config.entitySingularName!)}Payload`,
        fields: {
          [entity.config.entitySingularName!]: {
            type: entityType
          }
        }
      }),
      args: {
        ...(entityInput && { input: { type: entityInput } }),
      },
      resolve: async (_: any, args: any, req: Request) => {
        const apiKey = entity.config.apiKey || 'id'
        req.params = {
          id: args.input[apiKey]
        }
        delete args.input[apiKey]
        req.body = args.input
        const res = await entity.controller.update(req)
        return {
          [entity.config.entitySingularName!]: res.item
        }
      },
      description: `Update a ${capitalize(entity.config.entitySingularName!)}.`
    }
  },

  deleteEntity (entity: Entity<EntityModel>, entityType: GraphQLObjectType, entityInput?: GraphQLInputObjectType) {
    return {
      type: new GraphQLObjectType({
        name: `Delete${capitalize(entity.config.entitySingularName!)}Payload`,
        fields: {
          result: {
            type: new GraphQLNonNull(GraphQLBoolean)
          }
        }
      }),
      args: {
        ...(entityInput && { input: { type: entityInput } }),
      },
      resolve: async (_: any, args: any, req: Request) => {
        const apiKey = entity.config.apiKey || 'id'
        req.params = {
          id: args.input[apiKey]
        }
        delete args.input[apiKey]
        req.body = args.input
        return await entity.controller.delete(req)
      },
      description: `Delete a ${capitalize(entity.config.entitySingularName!)}.`
    }
  },

  getViewer (usersEntityType: GraphQLObjectType) {
    const controller = Commun.getEntityController('users')
    return {
      type: new GraphQLNonNull(usersEntityType),
      resolve: async (_: any, args: any, req: Request) => {
        if (!req.auth?.id) {
          throw new UnauthorizedError()
        }
        req.params = {
          id: req.auth.id
        }
        const res = await controller.get(req, { findModelById: true })
        return res.item
      },
      description: 'The currently authenticated user.',
    }
  },
}
