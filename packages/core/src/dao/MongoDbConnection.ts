import { Db, MongoClient } from 'mongodb'

let mongoDb: Db
let mongoClient: MongoClient

export const MongoDbConnection = {
  getDb () {
    return mongoDb
  },

  setDb (db: Db) {
    mongoDb = db
  },

  getClient () {
    return mongoClient
  },

  setClient (client: MongoClient) {
    mongoClient = client
  }
}
