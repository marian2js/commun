import { EntityConfig, EntityModel } from '..'
import { Collection, ObjectId } from 'mongodb'
import { MongoDbConnection } from './MongoDbConnection'

export type DaoFilter<T> = {
  [P in keyof T]?: any
}

type SortOption<T> = {
  [P in keyof T]?: 1 | -1
}

export class EntityDao<T extends EntityModel> {
  protected _collection?: Collection

  constructor (protected readonly collectionName: string) {}

  async find (filter: DaoFilter<T>, sort: SortOption<T> = {}): Promise<T[]> {
    return (await this.collection.find(filter, { sort }).toArray())
      .map(item => {
        item.createdAt = item._id.getTimestamp()
        item._id = item._id.toString()
        return item
      })
  }

  async findOne (filter: DaoFilter<T> = {}): Promise<T | null> {
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

  async updateOne (id: string, data: { [key in keyof T]?: any }): Promise<T> {
    const res = await this.collection
      .findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: { ...data, updatedAt: new Date() }
      }, { returnOriginal: false })
    const item = res.value
    item._id = item._id.toString()
    item.createdAt = new ObjectId(item._id.toString()).getTimestamp()
    return item
  }

  async incrementOne (id: string, data: { [key in keyof T]?: any }): Promise<T> {
    const res = await this.collection
      .findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: { updatedAt: new Date() },
        $inc: { ...data }
      }, { returnOriginal: false })
    const item = res.value
    item._id = item._id.toString()
    item.createdAt = new ObjectId(item._id.toString()).getTimestamp()
    return item
  }

  async deleteOne (id: string): Promise<boolean> {
    const res = await this.collection.deleteOne({ _id: new ObjectId(id) })
    return res && res.result && !!res.result.ok
  }

  async createIndexes (config: EntityConfig<T>) {
    for (const [key, attribute] of Object.entries(config.attributes)) {
      if (attribute!.unique) {
        await this.collection.createIndex(key, { unique: true, sparse: !attribute!.required })
      } else if (attribute!.index) {
        await this.collection.createIndex(key, { sparse: !attribute!.required })
      }
    }
    if (config.indexes) {
      for (const index of config.indexes) {
        const indexOptions = { ...index }
        delete indexOptions.keys
        await this.collection.createIndex(index.keys, indexOptions)
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
