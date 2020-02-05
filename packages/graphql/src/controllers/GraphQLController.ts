import { GraphQLArgument, GraphQLInputObjectType, GraphQLNonNull } from 'graphql/type/definition'
import { GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { Request } from 'express'
import { Entity, EntityModel } from '@commun/core'
import { capitalize } from '../utils/StringUtils'

export const GraphQLController = {
  listEntities (
    entity: Entity<EntityModel>,
    entityType: GraphQLObjectType,
    getEntityInput?: GraphQLInputObjectType,
    filterByEntityInput?: GraphQLInputObjectType,
    orderByEntityInput?: GraphQLInputObjectType
  ) {
    const args: any = {}
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
        if (args.filter) {
          req.query.filter = args.filter
        }
        if (args.orderBy) {
          req.query.orderBy = args.orderBy
            .map((orderBy: { [key: string]: 'asc' | 'desc' }) => Object.entries(orderBy).map(entry => entry.join(':')).join(';'))
            .join(';')
        }
        const res = await entity.controller.list(req)
        return {
          nodes: res.items
        }
      }
    }
  },

  getEntity (entity: Entity<EntityModel>, entityType: GraphQLObjectType) {
    const apiKey = entity.config.apiKey || '_id'
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
      }
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
      }
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
        const apiKey = entity.config.apiKey || '_id'
        req.params = {
          id: args.input[apiKey]
        }
        delete args.input[apiKey]
        req.body = args.input
        const res = await entity.controller.update(req)
        return {
          [entity.config.entitySingularName!]: res.item
        }
      }
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
        const apiKey = entity.config.apiKey || '_id'
        req.params = {
          id: args.input[apiKey]
        }
        delete args.input[apiKey]
        req.body = args.input
        return await entity.controller.delete(req)
      }
    }
  },
}
