import { ObjectId } from 'mongodb'
import { Commun } from '../../src'
import supertest = require('supertest')

const app = Commun.createExpressApp()

let authRequest: boolean = false
let authUserId: string

app.use((req, res, next) => {
  req.auth = authRequest ? { _id: authUserId } : undefined
  next()
})

Commun.configureRoutes()

export const request = () => {
  authRequest = false
  return supertest(app)
}

export const authenticatedRequest = (userId: string = new ObjectId().toString()) => {
  authRequest = true
  authUserId = userId
  return supertest(app)
}
