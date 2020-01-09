import { Request, Response } from 'express'
import { Commun, EntityModel, getModelAttribute } from '..'
import { EntityActionPermissions } from '../types'
import { ClientError, NotFoundError, UnauthorizedError } from '../errors'

export class EntityController<T extends EntityModel> {

  constructor (protected readonly entityName: string) {}

  protected get config () {
    return Commun.getEntityConfig<T>(this.entityName)
  }

  protected get dao () {
    return Commun.getEntityDao<T>(this.entityName)
  }

  async list (req: Request, res: Response): Promise<{ items: T[] }> {
    this.validateActionPermissions('get')
    const models = await this.dao.find({})
    return {
      items: await Promise.all(models.map(async model => await this.prepareModelResponse(model)))
    }
  }

  async get (req: Request, res: Response): Promise<{ item: T }> {
    this.validateActionPermissions('get')
    const model = await this.dao.findOneById(req.params.id)
    if (!model) {
      throw new NotFoundError()
    }
    return {
      item: await this.prepareModelResponse(model)
    }
  }

  async create (req: Request, res: Response): Promise<{ item: T }> {
    this.validateActionPermissions('create')
    const model = await this.getModelFromBodyRequest(req, 'create')
    try {
      const insertedModel = await this.dao.insertOne(model)
      return {
        item: await this.prepareModelResponse(insertedModel)
      }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async update (req: Request, res: Response): Promise<{ result: boolean }> {
    const model = this.dao.findOneById(req.params.id)
    if (!model) {
      throw new NotFoundError()
    }
    this.validateActionPermissions('update')
    const modelData = await this.getModelFromBodyRequest(req, 'update')
    try {
      const result = await this.dao.updateOne(req.params.id, modelData)
      return { result }
    } catch (e) {
      if (e.code === 11000) {
        throw new ClientError('Duplicated key', 400)
      }
      throw e
    }
  }

  async delete (req: Request, res: Response): Promise<{ result: boolean }> {
    this.validateActionPermissions('delete')
    const result = await this.dao.deleteOne(req.params.id)
    return { result }
  }

  protected async getModelFromBodyRequest (req: Request, action: 'create' | 'update'): Promise<T> {
    const model: { [key in keyof T]: any } = {} as T
    for (const [key, attribute] of Object.entries(this.config.attributes)) {
      if (this.hasValidPermissions(action, { ...this.config.permissions, ...attribute!.permissions })) {
        model[key as keyof T] = await getModelAttribute(attribute!, key, req.body[key])
      }
    }
    return model
  }

  protected async prepareModelResponse (model: T): Promise<T> {
    const item: { [key in keyof T]: any } = {} as T
    const attributes = Object.entries(this.config.attributes)
    if (!this.config.attributes._id) {
      attributes.unshift(['_id', {
        type: 'string',
        permissions: { get: this.config.permissions?.get }
      }])
    }
    for (const [key, attribute] of attributes) {
      if (this.hasValidPermissions('get', { ...this.config.permissions, ...attribute!.permissions })) {
        item[key as keyof T] = model[key as keyof T]
      }
    }
    return item
  }

  protected validateActionPermissions (action: keyof EntityActionPermissions) {
    if (!this.hasValidPermissions(action, this.config.permissions)) {
      throw new UnauthorizedError()
    }
  }

  protected hasValidPermissions (action: keyof EntityActionPermissions, permissions?: EntityActionPermissions) {
    if (!permissions) {
      return false
    }
    return Array.isArray(permissions[action]) ?
      permissions[action]!.includes('anyone') : permissions[action] === 'anyone'
  }
}
