import { Express } from 'express'
import { Db, ObjectId } from 'mongodb'
import supertest from 'supertest'

let expressApp: Express
let authRequest: boolean = false
let authUserId: string
let Commun: any
export let connectionDb: Db

export const startTestApp = async (commun: any) => {
  Commun = commun
  Commun.setOptions({
    port: 1234,
    mongoDB: {
      uri: process.env.MONGO_URL!,
      dbName: 'jest'
    }
  })

  expressApp = Commun.createExpressApp()

  expressApp.use((req, res, next) => {
    req.auth = authRequest ? { _id: authUserId } : undefined
    next()
  })

  Commun.configureRoutes()

  connectionDb = (await Commun.connectDb()).getDb()
}

export const stopTestApp = async (collectionName?: string) => {
  if (collectionName) {
    try {
      await connectionDb.collection(collectionName).drop()
    } catch (e) {}
  }
  jest.clearAllMocks()
}

export const closeTestApp = async () => {
  await Commun.closeDb()
}

export const getTestApp = () => expressApp

export const request = () => {
  authRequest = false
  return supertest(expressApp)
}

export const authenticatedRequest = (userId: string = new ObjectId().toString()) => {
  authRequest = true
  authUserId = userId
  return supertest(expressApp)
}
