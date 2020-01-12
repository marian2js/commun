import { Request, Response } from 'express'
import {
  Commun,
  DaoFilter,
  EntityModel,
  getModelAttribute,
  ModelAttribute,
  parseModelAttribute,
  RefModelAttribute,
  UnauthorizedError
} from '..'
import { EntityActionPermissions } from '../types'
import { ClientError, NotFoundError } from '../errors'

export class EntityController<T extends EntityModel> {

  constructor (protected readonly entityName: string) {}

  protected get config () {
    return Commun.getEntityConfig<T>(this.entityName)
  }

  protected get dao () {
    return Commun.getEntityDao<T>(this.entityName)
  }

  async list (req: Request, res: Response): Promise<{ items: T[] }> {
    if (this.config.permissions?.get !== 'own') {
      this.validateActionPermissions(req, null, 'get')
    }

    const sort: { [P in keyof T]?: 1 | -1 } = {}
    if (req.query.sort) {
      const [sortKey, sortDir] = req.query.sort.split(':')
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'createdAt') {
        sort._id = dir
      } else {
        sort[sortKey as keyof T] = dir
      }
    }

    const filter: { [P in keyof T]?: any } = {}
    if (req.query.filter) {
      const filterStrings = req.query.filter.split(';')
      for (const filterString of filterStrings) {
        const filterParts = filterString.split(':')
        const filterKey = filterParts[0] as keyof T
        const filterValue = filterParts[1]
        if (this.config.attributes[filterKey]) {
          filter[filterKey] = parseModelAttribute(this.config.attributes[filterKey], filterValue)
        }
      }
    }

    const populate = this.getPopulateFromRequest(req)

    const models = (await this.dao.find(filter, sort))
      .filter(model => this.hasValidPermissions(req, model, 'get', this.config.permissions))
    return {
      items: await Promise.all(models.map(async model => await this.prepareModelResponse(req, model, populate)))
    }
  }

  async get (req: Request, res: Response): Promise<{ item: T }> {
    const model = await this.findModelByApiKey(req)
    if (!model) {
      throw new NotFoundError()
    }
    this.validateActionPermissions(req, model, 'get')
    return {
      item: await this.prepareModelResponse(req, model, this.getPopulateFromRequest(req))
    }
  }

  async create (req: Request, res: Response): Promise<{ item: T }> {
    this.validateActionPermissions(req, null, 'create')
    const model = await this.getModelFromBodyRequest(req, 'create')
    try {
      const insertedModel = await this.dao.insertOne(model)
      return {
        item: await this.prepareModelResponse(req, insertedModel)
      }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async update (req: Request, res: Response): Promise<{ result: boolean }> {
    const model = await this.findModelByApiKey(req)
    if (!model) {
      throw new NotFoundError()
    }
    this.validateActionPermissions(req, model, 'update')
    const modelData = await this.getModelFromBodyRequest(req, 'update', model)
    try {
      const result = await this.dao.updateOne(model._id!, modelData)
      return { result }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async delete (req: Request, res: Response): Promise<{ result: boolean }> {
    const model = await this.findModelByApiKey(req)
    if (!model) {
      return { result: true }
    }
    this.validateActionPermissions(req, model, 'delete')
    const result = await this.dao.deleteOne(model._id!)
    return { result }
  }

  protected findModelByApiKey (req: Request) {
    if (!this.config.apiKey || this.config.apiKey === '_id') {
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

      const validPermissions = this.hasValidPermissions(req, persistedModel || null, action, permissions)
      const shouldSetValue = action === 'create' || (!attribute!.readonly && req.body[key] !== undefined)
      const settingUser = attribute!.type === 'user' && action === 'create'

      if ((validPermissions && shouldSetValue) || settingUser) {
        model[key as keyof T] = await getModelAttribute(attribute!, key, req.body, req.auth?._id)
      }
    }
    return model
  }

  protected async prepareModelResponse (req: Request, model: T, populate: { [P in keyof T]?: any } = {}): Promise<T> {
    const item: { [key in keyof T]: any } = {} as T
    const attributes = Object.entries(this.config.attributes)
    if (!this.config.attributes._id) {
      attributes.unshift(['_id', {
        type: 'string',
        permissions: { get: this.config.permissions?.get }
      }])
    }
    for (const [key, attribute] of attributes) {
      if (this.hasValidPermissions(req, model, 'get', { ...this.config.permissions, ...attribute!.permissions })) {
        item[key as keyof T] = await this.prepareModelAttributeResponse(req, model, key as keyof T, attribute!, populate)
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
      return model[key]
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

  protected validateActionPermissions (req: Request, model: T | null, action: keyof EntityActionPermissions) {
    if (!this.hasValidPermissions(req, model, action, this.config.permissions)) {
      throw new UnauthorizedError()
    }
  }

  protected hasValidPermissions (req: Request, model: T | null, action: keyof EntityActionPermissions, permissions?: EntityActionPermissions) {
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

    return false
  }
}
