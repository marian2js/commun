import supertest = require('supertest')
import { Commun } from '../../src'

const app = Commun.createExpressApp()
Commun.configureRoutes()

export const request = () => supertest(app)
