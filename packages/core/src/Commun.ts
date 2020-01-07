import express, { Express } from 'express'
import compression from 'compression'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import morgan from 'morgan'
import { EntityModel } from './types/EntityModel'
import errorHandler from 'errorhandler'
import { MongoClient } from 'mongodb'
import { MongoDbConnection } from './dao/MongoDbConnection'
import { Entity, RegisterEntityOptions } from './types/Entity'
import { EntityController } from './controllers/EntityController'
import { EntityConfig } from './types/EntityConfig'
import { EntityDao } from './dao/EntityDao'

const entities: { [key: string]: Entity<EntityModel> } = {}

export const Commun = {
  createApp (): Express {
    const app = express()

    // Express configuration
    app.set('port', process.env.PORT || 3000)
    app.use(compression())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(lusca.xframe('SAMEORIGIN'))
    app.use(lusca.xssProtection(true))

    if (process.env.NODE_ENV === 'production') {
      app.use(morgan('short'))
    } else {
      app.use(morgan('tiny'))
    }

    return app
  },

  configureRoutes (app: Express) {
    app.use('/api/v1', require('./routes/ApiRoutes').default)
  },

  async connectDb () { // TODO
    const client = new MongoClient(process.env.MONGO_URL!, {
      useUnifiedTopology: true
    })
    await client.connect()
    MongoDbConnection.setClient(client)
    MongoDbConnection.setDb(client.db('commun'))
    console.log('Connected to MongoDB')
  },

  async closeDb () {
    await MongoDbConnection.getClient().close()
  },

  async startServer (expressApp?: Express) {
    const app = expressApp || Commun.createApp()
    Commun.configureRoutes(app)

    if (process.env.NODE_ENV !== 'production') {
      app.use(errorHandler())
    }

    await Commun.connectDb()
    // await configurePassport()

    app.listen(app.get('port'), () => {
      console.log(`${app.get('env')} server started at http://localhost:${app.get('port')}`)
    })

    return app
  },

  async registerEntity<MODEL extends EntityModel> (entity: RegisterEntityOptions<MODEL>) {
    if (!entity.config.entityName) {
      throw new Error('Config must include "entityName"')
    }
    if (!entity.config.collectionName) {
      throw new Error('Config must include "collectionName"')
    }
    entities[entity.config.entityName] = {
      ...entity,
      dao: entity.dao || new EntityDao<MODEL>(entity.config.collectionName),
      controller: entity.controller || new EntityController<MODEL>(entity.config.entityName),
    }
    await entities[entity.config.entityName].dao.createIndexes(entity.config)
  },

  getEntity<MODEL extends EntityModel> (entityName: string): Entity<MODEL> {
    const entity = entities[entityName] as Entity<MODEL>
    if (!entity) {
      throw new Error(`Entity ${entityName} not registered`)
    }
    return entity
  },

  getEntityConfig<MODEL extends EntityModel> (entityName: string): EntityConfig<MODEL> {
    return this.getEntity<MODEL>(entityName).config
  },

  getEntityDao<MODEL extends EntityModel> (entityName: string): EntityDao<MODEL> {
    return this.getEntity<MODEL>(entityName).dao
  },

  getEntityController<MODEL extends EntityModel> (entityName: string): EntityController<MODEL> {
    return this.getEntity<MODEL>(entityName).controller
  },

  getEntityRouter<MODEL extends EntityModel> (entityName: string): express.Router | undefined {
    return this.getEntity<MODEL>(entityName).router
  },
}
