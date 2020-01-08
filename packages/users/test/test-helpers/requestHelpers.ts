import supertest = require('supertest')
import { Commun } from '@commun/core'

const app = Commun.createApp()
Commun.configureRoutes(app)

export const request = () => supertest(app)
