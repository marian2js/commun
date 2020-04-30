import { Request } from 'express'
import {
  Commun,
  DaoFilter,
  EntityModel,
  EntityPermission,
  getJoinAttribute,
  getModelAttribute,
  ModelAttribute,
  RefModelAttribute,
  UnauthorizedError
} from '..'
import { EntityActionPermissions } from '../types'
import { ClientError, NotFoundError } from '../errors'
import { entityHooks } from '../entity/entityHooks'
import {
  ApiEntityFilter,
  decodePaginationCursor,
  encodePaginationCursor,
  parseFilter,
  strToApiFilter
} from '../utils/ApiUtils'

type RequestOptions = {
  findModelById?: boolean
}

type PageInfo = {
  startCursor?: string
  endCursor?: string
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

interface EntityListRequestedKeys {
  nodes?: object
  pageInfo?: PageInfo
  totalCount?: number
}

interface EntityListResult<T extends EntityModel> {
  items: T[]
  pageInfo: PageInfo
  totalCount?: number
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

export class EntityController<T extends EntityModel> {

  constructor (protected readonly entityName: string) {}

  protected get config () {
    return Commun.getEntityConfig<T>(this.entityName)
  }

  protected get dao () {
    return Commun.getEntityDao<T>(this.entityName)
  }

  async list (req: Request, requestedKeys?: 'all' | EntityListRequestedKeys): Promise<EntityListResult<T>> {
    if (this.config.permissions?.get !== 'own') {
      await this.validateActionPermissions(req, null, 'get')
    }

    const pageInfo: PageInfo = {}

    const sort: { [P in keyof T]?: 1 | -1 } = {}
    const orderBy = req.query.orderby || req.query.orderBy
    if (orderBy && typeof orderBy === 'string') {
      const [sortKey, sortDir] = orderBy.split(':')
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'createdAt') {
        sort.id = dir
      } else {
        sort[sortKey as keyof T] = dir
      }
    }

    let filter: DaoFilter<T> = {}
    if (req.query.filter) {
      let entityFilter
      if (typeof req.query.filter === 'string') {
        entityFilter = strToApiFilter(req.query.filter, this.config.attributes)
      }
      filter = parseFilter(entityFilter || req.query.filter as ApiEntityFilter, this.config.attributes) as DaoFilter<T>
    }

    if (req.query.search && typeof req.query.search === 'string') {
      filter.$text = {
        $search: req.query.search
      }
    }

    let limit = Number(req.query.first) || DEFAULT_PAGE_SIZE
    if (limit > MAX_PAGE_SIZE) {
      limit = MAX_PAGE_SIZE
    }

    // if hasNextPage was requested, increase the limit in 1, but don't return that item
    const requestedHasNextPage = requestedKeys === 'all' || requestedKeys?.pageInfo?.hasNextPage
    if (requestedHasNextPage) {
      limit++
    }

    let skip
    if (Number.isInteger(Number(req.query.last)) && Number(req.query.last) > 0) {
      skip = Number(req.query.last)
    }
    let before
    if (req.query.before && typeof req.query.before === 'string') {
      before = decodePaginationCursor<T>(req.query.before.trim())
    }
    let after
    if (req.query.after && typeof req.query.after === 'string') {
      after = decodePaginationCursor<T>(req.query.after.trim())
    }

    const populate = this.getPopulateFromRequest(req)

    const queryResult = await this.dao.findAndReturnCursor(filter, { sort, limit, skip, before, after })
    const models = queryResult.items

    if (requestedHasNextPage && models.length === limit) {
      models.pop()
      pageInfo.hasNextPage = true
    }

    const modelPermissions = await Promise.all(models.map(async model => await this.hasValidPermissions(req, model, 'get', this.config.permissions)))
    const modelsWithValidPermissions = models.filter((_, i) => modelPermissions[i])

    const items = await Promise.all(modelsWithValidPermissions.map(async model => await this.prepareModelResponse(req, model, populate)))

    if (items.length) {
      pageInfo.startCursor = encodePaginationCursor(items[0], sort)
      pageInfo.endCursor = encodePaginationCursor(items[items.length - 1], sort)
    }
    if (requestedKeys === 'all' || requestedKeys?.pageInfo) {
      pageInfo.hasPreviousPage = !!skip || !!after
      pageInfo.hasNextPage = pageInfo.hasNextPage || false
    }

    const entityListResult: EntityListResult<T> = {
      items,
      pageInfo,
    }

    if (typeof requestedKeys === 'object' && requestedKeys.totalCount) {
      entityListResult.totalCount = await queryResult.cursor.count()
    }

    return entityListResult
  }

  async get (req: Request, options: RequestOptions = {}): Promise<{ item: T }> {
    const model = await this.findModelByApiKey(req, options)
    if (!model) {
      throw new NotFoundError()
    }
    await this.validateActionPermissions(req, model, 'get')
    await entityHooks.run(this.entityName, 'beforeGet', model, req.auth?.id)
    const item = await this.prepareModelResponse(req, model, this.getPopulateFromRequest(req))
    await entityHooks.run(this.entityName, 'afterGet', model, req.auth?.id)
    return {
      item
    }
  }

  async create (req: Request): Promise<{ item: T }> {
    await this.validateActionPermissions(req, null, 'create')
    const model = await this.getModelFromBodyRequest(req, 'create')
    await entityHooks.run(this.entityName, 'beforeCreate', model, req.auth?.id)
    try {
      const insertedModel = await this.dao.insertOne(model)
      await entityHooks.run(this.entityName, 'afterCreate', insertedModel, req.auth?.id)
      return {
        item: await this.prepareModelResponse(req, insertedModel, this.getPopulateFromRequest(req))
      }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async update (req: Request, options: RequestOptions = {}): Promise<{ item: T }> {
    const model = await this.findModelByApiKey(req, options)
    if (!model) {
      throw new NotFoundError()
    }
    await this.validateActionPermissions(req, model, 'update')
    await entityHooks.run(this.entityName, 'beforeUpdate', model, req.auth?.id)
    const modelData = await this.getModelFromBodyRequest(req, 'update', model)
    try {
      const updatedItem = await this.dao.updateOne(model.id!, modelData)
      await entityHooks.run(this.entityName, 'afterUpdate', updatedItem, req.auth?.id)
      return {
        item: await this.prepareModelResponse(req, updatedItem, this.getPopulateFromRequest(req))
      }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async delete (req: Request, options: RequestOptions = {}): Promise<{ result: boolean }> {
    const model = await this.findModelByApiKey(req, options)
    if (!model) {
      return { result: true }
    }
    await this.validateActionPermissions(req, model, 'delete')
    await entityHooks.run(this.entityName, 'beforeDelete', model, req.auth?.id)
    const result = await this.dao.deleteOne(model.id!)
    await entityHooks.run(this.entityName, 'afterDelete', model, req.auth?.id)
    return { result }
  }

  protected findModelByApiKey (req: Request, options: RequestOptions) {
    if (options.findModelById || !this.config.apiKey || this.config.apiKey === 'id') {
      return this.dao.findOneById(req.params.id)
    }
    const attrKey: keyof T = <keyof T>this.config.apiKey as keyof T
    const attribute = this.config.attributes[attrKey]
    let value: string | number | boolean
    if (attribute?.type === 'number') {
      value = Number(req.params.id)
    } else if (attribute?.type === 'boolean') {
      value = Boolean(req.params.id)
    } else {
      value = req.params.id
    }
    return this.dao.findOne({ [attrKey]: value } as DaoFilter<T>)
  }

  protected async getModelFromBodyRequest (req: Request, action: 'create' | 'update', persistedModel?: T): Promise<T> {
    const model: { [key in keyof T]: any } = {} as T
    for (const [key, attribute] of Object.entries(this.config.attributes)) {
      const permissions = {
        ...this.config.permissions,
        ...attribute!.permissions
      }

      const validPermissions = await this.hasValidPermissions(req, persistedModel || null, action, permissions)
      const shouldSetValue = action === 'create' || (!attribute!.readonly && req.body[key] !== undefined)
      const settingUser = attribute!.type === 'user' && action === 'create'

      if ((validPermissions && shouldSetValue) || settingUser) {
        model[key as keyof T] = await getModelAttribute(attribute!, key, req.body, req.auth?.id, action === 'update')
      } else if (attribute!.default !== undefined && action === 'create') {
        model[key as keyof T] = await getModelAttribute(attribute!, key, {}, req.auth?.id)
      }
    }
    return model
  }

  protected async prepareModelResponse (req: Request, model: T, populate: { [P in keyof T]?: any } = {}): Promise<T> {
    const item: { [key in keyof T]: any } = {} as T
    const attributes = Object.entries(this.config.attributes)

    // Prepare attributes
    for (const [key, attribute] of attributes) {
      if (key === 'email') {
      }
      if (await this.hasValidPermissions(req, model, 'get', { ...this.config.permissions, ...attribute!.permissions })) {
        if (key === 'email') {
        }
        item[key as keyof T] = await this.prepareModelAttributeResponse(req, model, key as keyof T, attribute!, populate)
      }
    }

    // Prepare joinAttributes
    for (const [key, joinAttribute] of Object.entries(this.config.joinAttributes || {})) {
      if (await this.hasValidPermissions(req, model, 'get', { ...this.config.permissions, ...joinAttribute.permissions })) {
        const joinedAttribute = await getJoinAttribute(joinAttribute, model, req.auth?.id)
        if (joinedAttribute) {
          const joinAttrController = Commun.getEntityController(joinAttribute.entity)
          if (Array.isArray(joinedAttribute)) {
            item[key as keyof T] = await Promise.all(joinedAttribute.map(attr => joinAttrController.prepareModelResponse(req, attr)))
          } else {
            item[key as keyof T] = await joinAttrController.prepareModelResponse(req, joinedAttribute)
          }
        }
      }
    }

    return item
  }

  protected async prepareModelAttributeResponse (
    req: Request,
    model: T,
    key: keyof T,
    attribute: ModelAttribute,
    populate: { [P in keyof T]?: any }
  ): Promise<any> {
    if (key === 'id' || !['ref', 'user'].includes(attribute!.type)) {
      return model[key] === undefined || model[key] === null ? attribute.default : model[key]
    }
    if (!populate[key] || !model[key]) {
      return model[key] ? { id: model[key] } : undefined
    }
    const populateEntityName = attribute!.type === 'ref' ? (attribute as RefModelAttribute).entity : 'users'
    const populatedItem = await Commun.getEntityDao(populateEntityName).findOneById('' + model[key as keyof T])
    if (populatedItem) {
      return await Commun.getEntityController(populateEntityName).prepareModelResponse(req, populatedItem, {})
    }
    return { id: model[key] }
  }

  protected getPopulateFromRequest (req: Request) {
    const populate: { [P in keyof T]?: any } = {}
    if (req.query.populate && typeof req.query.populate === 'string') {
      const populateKeys = req.query.populate.split(';')
      for (const key of populateKeys) {
        populate[key as keyof T] = true
      }
    }
    return populate
  }

  protected async validateActionPermissions (req: Request, model: T | null, action: keyof EntityActionPermissions) {
    if (!(await this.hasValidPermissions(req, model, action, this.config.permissions))) {
      throw new UnauthorizedError()
    }
  }

  protected async hasValidPermissions (req: Request, model: T | null, action: keyof EntityActionPermissions, permissions?: EntityActionPermissions) {
    if (!permissions) {
      return false
    }

    const permission = permissions[action]!

    const hasAnyoneAccess = Array.isArray(permission) ? permission.includes('anyone') : permission === 'anyone'
    if (hasAnyoneAccess) {
      return true
    }
    if (!req.auth?.id) {
      return false
    }

    const hasUserAccess = Array.isArray(permission) ? permission.includes('user') : permission === 'user'
    if (hasUserAccess) {
      return true
    }

    const hasOwnAccess = Array.isArray(permission) ? permission.includes('own') : permission === 'own'
    if (hasOwnAccess && model) {
      const userAttrEntries = Object.entries(this.config.attributes).find(([_, value]) => value?.type === 'user')
      if (userAttrEntries && userAttrEntries[0]) {
        const userId = '' + (model as { [key in keyof T]?: any })[userAttrEntries[0] as keyof T]
        if (userId && userId === req.auth.id) {
          return true
        }
      }
    }

    const hasSystemOnlyAccess = Array.isArray(permission) ?
      !(permission as EntityPermission[]).find(permission => permission !== 'system') : permission === 'system'
    if (!hasSystemOnlyAccess) {
      const user = await Commun.getEntityDao<EntityModel & { admin: boolean }>('users').findOneById(req.auth.id)
      return user && user.admin
    }

    return false
  }
}
