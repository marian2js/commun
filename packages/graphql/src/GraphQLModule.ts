import { Commun } from '@commun/core'
import { Express } from 'express'
import ExpressGraphQL from 'express-graphql'
import { createGraphQLSchema } from './SchemaBuilder'

export const GraphQLModule = {
  async setup () {
    Commun.registerPlugin('graphql', {
      onExpressAppCreated: this.setupGraphql.bind(this)
    })
  },

  async setupGraphql (app: Express) {
    app.use('/graphql', ExpressGraphQL({
      schema: createGraphQLSchema(),
      graphiql: process.env.NODE_ENV === 'development',
    }))
  },
}
