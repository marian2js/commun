import supertest = require('supertest')
import { Commun } from '@commun/core'

const app = Commun.createExpressApp()
Commun.configureRoutes()

export const request = () => supertest(app)
