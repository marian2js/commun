import supertest = require('supertest')
import { Commun } from '@commun/core'

Commun.setOptions({
  port: 1234,
  mongoDB: {
    uri: process.env.MONGO_URL!,
    dbName: 'jest'
  }
})
const app = Commun.createExpressApp()

export const request = () => supertest(app)
