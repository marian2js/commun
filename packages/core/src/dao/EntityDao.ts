import { EntityConfig, EntityModel } from '..'
import { Collection, ObjectId } from 'mongodb'
import { MongoDbConnection } from './MongoDbConnection'

export type DaoFilter<T> = EntityFilter<T> & SearchFilter<T>

type EntityFilter<T> = {
  [P in keyof T]?: any
}

type SearchFilter<T> = {
  $text?: {
    $search: string
  }
}

type FindOptions<T> = {
  sort?: SortOption<T>
  limit?: number
  skip?: number
  before?: Partial<T>
  after?: Partial<T>
}

export type SortOption<T> = {
  [P in keyof T]?: 1 | -1
}

const parseDbFieldsInput = <T extends EntityModel> (fields?: { [P in keyof T]?: any }, convertValues = true): any => {
  if (!fields) {
    return {}
  }
  const mongoFilterQuery = {
    ...fields,
    ...(fields.id && { _id: convertValues ? new ObjectId(fields.id) : fields.id }),
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
    const cursor = this.getFindCursor(filter, options)
    return (await cursor.toArray()).map(item => parseDbFieldsOutput(item))
  }

  async findAndReturnCursor (filter: DaoFilter<T>, options: FindOptions<T> = {}) {
    const cursor = this.getFindCursor(filter, options)
    return {
      items: (await cursor.toArray()).map(item => parseDbFieldsOutput(item)),
      cursor,
    }
  }

  protected getFindCursor (filter: DaoFilter<T>, options: FindOptions<T> = {}) {
    let sort = parseDbFieldsInput(options.sort, false)
    let projection
    if (filter.$text?.$search && (!sort || !Object.keys(sort).length)) {
      projection = sort = {
        __score: { $meta: 'textScore' }
      }
    }

    let filterData = parseDbFieldsInput(filter)
    if (options.before) {
      filterData = {
        ...filterData,
        ...cursorToFilter(options.before, sort, true)
      }
    }
    if (options.after) {
      filterData = {
        ...filterData,
        ...cursorToFilter(options.after, sort, false)
      }
    }

    return this.collection.find(filterData, {
      sort,
      projection,
      limit: options.limit,
      skip: options.skip,
    })
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

function cursorToFilter<T extends EntityModel> (cursor: Partial<T>, sort: { [key: string]: any }, reverse: boolean) {
  const cursorFields = parseDbFieldsInput(cursor)
  const cursorEntries = Object.entries(cursorFields)
  const sortData = Object.keys(sort).length > 0 ? sort : { _id: 1 }
  const sortValue = reverse ? 1 : -1

  if (!cursorEntries.length) {
    return {}
  }

  const [firstKey, firstValue] = cursorEntries[0]
  const filterCondition = {
    [firstKey]: sortData[firstKey] === sortValue ? { $lt: firstValue } : { $gt: firstValue }
  }

  if (cursorEntries.length === 1) {
    return filterCondition
  }

  const filter = {
    $or: [filterCondition]
  }

  const orFilter: { [key: string]: any } = {}
  for (const [key, value] of Object.entries(cursorFields)) {
    if (key === firstKey) {
      orFilter[key] = value
    } else {
      orFilter[key] = sortData[key] === sortValue ? { $lt: value } : { $gt: value }
    }
  }
  filter.$or.push(orFilter)

  return filter
}
