import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'

export const pageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    startCursor: {
      type: GraphQLString,
    },
    endCursor: {
      type: GraphQLString,
    },
    hasPreviousPage: {
      type: GraphQLBoolean
    },
    hasNextPage: {
      type: GraphQLBoolean
    },
  },
})
