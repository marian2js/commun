import supertest = require('supertest')
import { Commun } from '../../src'

const app = Commun.createApp()
Commun.configureRoutes(app)

export const request = () => supertest(app)
