import { EntityConfig, EntityModel } from '..'
import { Collection, ObjectId } from 'mongodb'
import { MongoDbConnection } from './MongoDbConnection'

type Filter<T> = {
  [P in keyof T]?: any
}

export class EntityDao<T extends EntityModel> {
  protected _collection?: Collection

  constructor (protected readonly collectionName: string) {}

  async find (filter: Filter<T>): Promise<T[]> {
    return (await this.collection.find(filter).toArray())
      .map(item => {
        item.createdAt = item._id.getTimestamp()
        item._id = item._id.toString()
        return item
      })
  }

  async findOne (filter: Filter<T> = {}): Promise<T | null> {
    const item = await this.collection.findOne(filter)
    if (!item) {
      return null
    }
    item.createdAt = item._id.getTimestamp()
    item._id = item._id.toString()
    return item
  }

  findOneById (id: string): Promise<T | null> {
    return this.findOne({ _id: new ObjectId(id) })
  }

  async insertOne (item: T) {
    const result = await this.collection.insertOne({ ...item })
    item._id = result.insertedId.toString()
    item.createdAt = new ObjectId(result.insertedId).getTimestamp()
    return item
  }

  async updateOne (id: string, data: { [key in keyof T]: any }): Promise<boolean> {
    const res = await this.collection
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })
    return res && res.result && !!res.result.ok
  }

  async deleteOne (id: string): Promise<boolean> {
    const res = await this.collection.deleteOne({ _id: new ObjectId(id) })
    return res && res.result && !!res.result.ok
  }

  async createIndexes (config: EntityConfig<T>) {
    for (const [key, attribute] of Object.entries(config.attributes)) {
      if (attribute!.unique) {
        await this.collection.createIndex({ [key]: 1 }, { unique: true, sparse: !attribute!.required })
      }
    }
  }

  protected get collection () {
    if (!this._collection) {
      this._collection = MongoDbConnection.getDb().collection(this.collectionName)
    }
    return this._collection
  }
}
