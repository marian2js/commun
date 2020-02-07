import { EntityConfig, EntityModel } from '..'
import { Collection, ObjectId } from 'mongodb'
import { MongoDbConnection } from './MongoDbConnection'

export type DaoFilter<T> = EntityFilter<T> & SearchFilter<T>

type EntityFilter<T> = {
  [P in keyof T]?: any
}

type SearchFilter<T> = {
  $text?: {
    $search: {
      [P in keyof T]?: string
    }
  }
}

type FindOptions<T> = {
  sort?: SortOption<T>
  limit?: number
}

type SortOption<T> = {
  [P in keyof T]?: 1 | -1
}

const parseDbFieldsInput = <T extends EntityModel> (fields?: { [P in keyof T]?: any }) => {
  if (!fields) {
    return {}
  }
  const mongoFilterQuery = {
    ...fields,
    ...(fields.id && { _id: fields.id }),
  }
  delete mongoFilterQuery.id
  return mongoFilterQuery
}

const parseDbFieldsOutput = (item: any) => {
  item.createdAt = item._id.getTimestamp()
  item.id = item._id.toString()
  delete item._id
  return item
}

export class EntityDao<T extends EntityModel> {
  protected _collection?: Collection

  constructor (protected readonly collectionName: string) {}

  async find (filter: DaoFilter<T>, options: FindOptions<T> = {}): Promise<T[]> {
    return (await this.collection.find(parseDbFieldsInput(filter), {
      sort: parseDbFieldsInput(options.sort),
      limit: options.limit
    }).toArray()).map(item => parseDbFieldsOutput(item))
  }

  async findOne (filter: DaoFilter<T> = {}): Promise<T | null> {
    const item = await this.collection.findOne(parseDbFieldsInput(filter))
    if (!item) {
      return null
    }
    return parseDbFieldsOutput(item)
  }

  findOneById (id: string): Promise<T | null> {
    return this.findOne({ id: new ObjectId(id) })
  }

  async insertOne (item: T) {
    const result = await this.collection.insertOne({ ...item })
    item.id = result.insertedId.toString()
    item.createdAt = new ObjectId(result.insertedId).getTimestamp()
    return item
  }

  async updateOne (id: string, data: { [key in keyof T]?: any }): Promise<T> {
    const res = await this.collection
      .findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: { ...data, updatedAt: new Date() }
      }, { returnOriginal: false })
    return parseDbFieldsOutput(res.value)
  }

  async incrementOne (id: string, data: { [key in keyof T]?: any }): Promise<T> {
    const res = await this.collection
      .findOneAndUpdate({ _id: new ObjectId(id) }, {
        $set: { updatedAt: new Date() },
        $inc: { ...data }
      }, { returnOriginal: false })
    return parseDbFieldsOutput(res.value)
  }

  async deleteOne (id: string): Promise<boolean> {
    const res = await this.collection.deleteOne({ _id: new ObjectId(id) })
    return res && res.result && !!res.result.ok
  }

  async getEstimatedCount () {
    return await this.collection.estimatedDocumentCount()
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
