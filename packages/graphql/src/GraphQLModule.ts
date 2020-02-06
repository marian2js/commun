import { Commun, ConfigManager } from '@commun/core'
import { Express } from 'express'
import ExpressGraphQL from 'express-graphql'
import { createGraphQLSchema } from './SchemaBuilder'
import { printSchema } from 'graphql'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

export const GraphQLModule = {
  async setup () {
    Commun.registerPlugin('graphql', {
      onExpressAppCreated: this.setupGraphql.bind(this)
    })
  },

  async setupGraphql (app: Express) {
    const schema = createGraphQLSchema()
    app.use('/graphql', ExpressGraphQL({
      schema,
      graphiql: process.env.NODE_ENV === 'development',
    }))

    if (process.env.NODE_ENV === 'development') {
      await this._writeFile(path.join(ConfigManager.projectRootPath, 'schema.graphql'), printSchema(schema))
    }
  },

  _writeFile: promisify(fs.writeFile),
}
