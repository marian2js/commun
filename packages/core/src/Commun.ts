import express, { Express } from 'express'
import compression from 'compression'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import morgan from 'morgan'
import { Entity, EntityConfig, EntityModel, Plugin, RegisterEntityOptions, RegisterPluginOptions } from './types'
import errorHandler from 'errorhandler'
import { MongoClient, MongoClientCommonOption } from 'mongodb'
import { MongoDbConnection } from './dao/MongoDbConnection'
import { EntityController, PluginController } from './controllers'
import { EntityDao } from './dao/EntityDao'
import { NotFoundError } from './errors'
import { ConfigManager } from './ConfigManager'

let entities: { [key: string]: Entity<EntityModel> } = {}
let plugins: { [key: string]: Plugin } = {}
let communOptions: CommunOptions

let app: Express

type CommunOptions = {
  port?: number
  endpoint?: string
  appName?: string
  mongoDB: {
    uri: string
    dbName: string
    options?: MongoClientCommonOption
  }
}

export const Commun = {
  createExpressApp (): Express {
    app = express()

    // Express configuration
    app.set('port', communOptions.port || process.env.PORT || 3000)
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

  getExpressApp () {
    return app
  },

  configureRoutes () {
    for (const module of [...Object.values(plugins), ...Object.values(entities)]) {
      if (module.router) {
        app.use('/api/v1', module.router)
      }
    }
    app.use('/api/v1', require('./routes/ApiRoutes').default)
  },

  async connectDb () {
    const client = new MongoClient(communOptions.mongoDB.uri, {
      useUnifiedTopology: true
    })
    await client.connect()
    MongoDbConnection.setClient(client)
    MongoDbConnection.setDb(client.db(communOptions.mongoDB.dbName, communOptions.mongoDB.options || {}))
    console.log('Connected to MongoDB')
    return MongoDbConnection
  },

  async createDbIndexes () {
    for (const entity of Object.values(entities)) {
      await entity.dao.createIndexes(entity.config)
    }
  },

  async closeDb () {
    await MongoDbConnection.getClient().close()
  },

  async startServer (dirname: string, options?: CommunOptions, expressApp?: Express) {
    ConfigManager.setRootPath(dirname)
    this.setOptions(options || await ConfigManager.readEnvConfig())
    await this._setupPlugins()
    await this._registerEntitiesFromConfigFiles()

    app = expressApp || app || this.createExpressApp()

    for (const module of [...Object.values(plugins), ...Object.values(entities)]) {
      if (module.onExpressAppCreated) {
        await module.onExpressAppCreated(app)
      }
    }
    this.configureRoutes()

    if (process.env.NODE_ENV !== 'production') {
      app.use(errorHandler())
    }

    await this.connectDb()
    await this.createDbIndexes()

    app.listen(app.get('port'), () => {
      console.log(`${app.get('env')} server started at http://localhost:${app.get('port')}`)
    })

    return app
  },

  async _registerEntitiesFromConfigFiles () {
    const entityConfigs = await ConfigManager.getEntityConfigs()
    for (const config of entityConfigs) {
      if (!entities[config.entityName]) {
        await this.registerEntity<EntityModel>({ config })
      }
    }
  },

  async _setupPlugins () {
    const plugins = await ConfigManager.getPluginNames()
    for (const pluginName of plugins) {
      await ConfigManager.runPluginSetup(pluginName)
    }
  },

  registerEntity<MODEL extends EntityModel> (entity: RegisterEntityOptions<MODEL>): Entity<MODEL> {
    if (!entity.config.entityName) {
      throw new Error('Config must include "entityName"')
    }
    if (!entity.config.collectionName) {
      throw new Error('Config must include "collectionName"')
    }
    if (!entity.config.attributes._id) {
      entity.config.attributes._id = {
        type: 'id',
        permissions: { get: entity.config.permissions?.get }
      }
    }
    const registeredEntity: Entity<MODEL> = {
      ...entity,
      dao: entity.dao || new EntityDao<MODEL>(entity.config.collectionName),
      controller: entity.controller || new EntityController<MODEL>(entity.config.entityName),
    }
    entities[entity.config.entityName] = registeredEntity
    return registeredEntity
  },

  getEntity<MODEL extends EntityModel> (entityName: string): Entity<MODEL> {
    const entity = entities[entityName] as Entity<MODEL>
    if (!entity) {
      throw new NotFoundError(`Entity ${entityName} not registered`)
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

  getEntities () {
    return entities
  },

  registerPlugin (pluginName: string, plugin: RegisterPluginOptions) {
    plugins[pluginName] = {
      controller: plugin.controller || new PluginController(),
      ...plugin
    }
    return plugins[pluginName]
  },

  getPlugin (pluginName: string) {
    const plugin = plugins[pluginName]
    if (!plugin) {
      throw new NotFoundError(`Plugin ${pluginName} not registered`)
    }
    return plugin
  },

  getOptions () {
    return communOptions
  },

  setOptions (options: CommunOptions) {
    communOptions = options
  },

  deregisterAll () {
    entities = {}
    plugins = {}
  }
}
