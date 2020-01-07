import { MongoDbConnection } from '../../src/dao/MongoDbConnection'

export const dbHelpers = {
  async dropCollection (collectionName: string) {
    try {
      await MongoDbConnection.getDb().collection(collectionName).drop()
    } catch (e) {}
  },
}
