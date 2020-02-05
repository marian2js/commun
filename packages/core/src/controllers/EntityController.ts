import { Request } from 'express'
import {
  Commun,
  DaoFilter,
  EntityModel,
  getJoinAttribute,
  getModelAttribute,
  ModelAttribute,
  RefModelAttribute,
  UnauthorizedError
} from '..'
import { EntityActionPermissions } from '../types'
import { ClientError, NotFoundError } from '../errors'
import { entityHooks } from '../entity/entityHooks'
import { parseFilter, strToApiFilter } from '../utils/ApiUtils'

type RequestOptions = {
  findModelById?: boolean
}

export class EntityController<T extends EntityModel> {

  constructor (protected readonly entityName: string) {}

  protected get config () {
    return Commun.getEntityConfig<T>(this.entityName)
  }

  protected get dao () {
    return Commun.getEntityDao<T>(this.entityName)
  }

  async list (req: Request): Promise<{ items: T[] }> {
    if (this.config.permissions?.get !== 'own') {
      await this.validateActionPermissions(req, null, 'get')
    }

    const sort: { [P in keyof T]?: 1 | -1 } = {}
    const orderBy = req.query.orderby || req.query.orderBy
    if (orderBy) {
      const [sortKey, sortDir] = orderBy.split(':')
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'createdAt') {
        sort._id = dir
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
      filter = parseFilter(entityFilter || req.query.filter, this.config.attributes) as DaoFilter<T>
    }

    const populate = this.getPopulateFromRequest(req)

    const models = await this.dao.find(filter, sort)
    const modelPermissions = await Promise.all(models.map(async model => await this.hasValidPermissions(req, model, 'get', this.config.permissions)))
    const modelsWithValidPermissions = models.filter((_, i) => modelPermissions[i])

    return {
      items: await Promise.all(modelsWithValidPermissions.map(async model => await this.prepareModelResponse(req, model, populate)))
    }
  }

  async get (req: Request, options: RequestOptions = {}): Promise<{ item: T }> {
    const model = await this.findModelByApiKey(req, options)
    if (!model) {
      throw new NotFoundError()
    }
    await this.validateActionPermissions(req, model, 'get')
    await entityHooks.run(this.entityName, 'beforeGet', model, req.auth?._id)
    const item = await this.prepareModelResponse(req, model, this.getPopulateFromRequest(req))
    await entityHooks.run(this.entityName, 'afterGet', model, req.auth?._id)
    return {
      item
    }
  }

  async create (req: Request): Promise<{ item: T }> {
    await this.validateActionPermissions(req, null, 'create')
    const model = await this.getModelFromBodyRequest(req, 'create')
    await entityHooks.run(this.entityName, 'beforeCreate', model, req.auth?._id)
    try {
      const insertedModel = await this.dao.insertOne(model)
      await entityHooks.run(this.entityName, 'afterCreate', insertedModel, req.auth?._id)
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
    await entityHooks.run(this.entityName, 'beforeUpdate', model, req.auth?._id)
    const modelData = await this.getModelFromBodyRequest(req, 'update', model)
    try {
      const updatedItem = await this.dao.updateOne(model._id!, modelData)
      await entityHooks.run(this.entityName, 'afterUpdate', updatedItem, req.auth?._id)
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
    await entityHooks.run(this.entityName, 'beforeDelete', model, req.auth?._id)
    const result = await this.dao.deleteOne(model._id!)
    await entityHooks.run(this.entityName, 'afterDelete', model, req.auth?._id)
    return { result }
  }

  protected findModelByApiKey (req: Request, options: RequestOptions) {
    if (options.findModelById || !this.config.apiKey || this.config.apiKey === '_id') {
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
        model[key as keyof T] = await getModelAttribute(attribute!, key, req.body, req.auth?._id, action === 'update')
      } else if (attribute!.default !== undefined && action === 'create') {
        model[key as keyof T] = await getModelAttribute(attribute!, key, {}, req.auth?._id)
      }
    }
    return model
  }

  protected async prepareModelResponse (req: Request, model: T, populate: { [P in keyof T]?: any } = {}): Promise<T> {
    const item: { [key in keyof T]: any } = {} as T
    const attributes = Object.entries(this.config.attributes)

    // Prepare attributes
    for (const [key, attribute] of attributes) {
      if (await this.hasValidPermissions(req, model, 'get', { ...this.config.permissions, ...attribute!.permissions })) {
        item[key as keyof T] = await this.prepareModelAttributeResponse(req, model, key as keyof T, attribute!, populate)
      }
    }

    // Prepare joinAttributes
    for (const [key, joinAttribute] of Object.entries(this.config.joinAttributes || {})) {
      if (await this.hasValidPermissions(req, model, 'get', { ...this.config.permissions, ...joinAttribute.permissions })) {
        const joinedAttribute = await getJoinAttribute(joinAttribute, model, req.auth?._id)
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
    if (key === '_id' || !['ref', 'user'].includes(attribute!.type)) {
      return model[key] === undefined || model[key] === null ? attribute.default : model[key]
    }
    if (!populate[key] || !model[key]) {
      return model[key] ? { _id: model[key] } : undefined
    }
    const populateEntityName = attribute!.type === 'ref' ? (attribute as RefModelAttribute).entity : 'users'
    const populatedItem = await Commun.getEntityDao(populateEntityName).findOneById('' + model[key as keyof T])
    if (populatedItem) {
      return await Commun.getEntityController(populateEntityName).prepareModelResponse(req, populatedItem, {})
    }
    return { _id: model[key] }
  }

  protected getPopulateFromRequest (req: Request) {
    const populate: { [P in keyof T]?: any } = {}
    if (req.query.populate) {
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

    const hasAnyoneAccess = Array.isArray(permissions[action]) ?
      permissions[action]!.includes('anyone') : permissions[action] === 'anyone'
    if (hasAnyoneAccess) {
      return true
    }
    if (!req.auth?._id) {
      return false
    }

    const hasUserAccess = Array.isArray(permissions[action]) ?
      permissions[action]!.includes('user') : permissions[action] === 'user'
    if (hasUserAccess) {
      return true
    }

    const hasOwnAccess = Array.isArray(permissions[action]) ?
      permissions[action]!.includes('own') : permissions[action] === 'own'
    if (hasOwnAccess && model) {
      const userAttrEntries = Object.entries(this.config.attributes).find(([_, value]) => value?.type === 'user')
      if (userAttrEntries && userAttrEntries[0]) {
        const userId = '' + (model as { [key in keyof T]?: any })[userAttrEntries[0] as keyof T]
        return userId && userId === req.auth._id
      }
    }

    const hasAdminAccess = Array.isArray(permissions[action]) ?
      permissions[action]!.includes('admin') : permissions[action] === 'admin'
    if (hasAdminAccess) {
      const user = await Commun.getEntityDao<EntityModel & { admin: boolean }>('users').findOneById(req.auth._id)
      return user && user.admin
    }

    return false
  }
}
