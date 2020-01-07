import express, { Express } from 'express'
import compression from 'compression'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import morgan from 'morgan'
import { EntityController } from './controllers/EntityController'
import { BaseEntity } from './types/BaseEntity'
import errorHandler from 'errorhandler'
import { MongoClient } from 'mongodb'
import { MongoDbConnection } from './dao/MongoDbConnection'

const controllers: { [key: string]: EntityController<BaseEntity> } = {}

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

  getController (entityName: string): EntityController<BaseEntity> {
    return controllers[entityName]
  },

  async registerController (controller: EntityController<BaseEntity>) {
    controllers[controller.config.entityName] = controller
    await controller.dao.createIndexes(controller.config)
  }
}
