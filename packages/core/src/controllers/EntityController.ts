import { Request, Response } from 'express'
import { BaseEntity, EntityConfig } from '..'
import { EntityDao } from '../dao/EntityDao'
import { EntityActionPermissions } from '../types/EntityPermission'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { NotFoundError } from '../errors/NotFoundError'
import { EntityAttribute, NumberEntityAttribute, StringEntityAttribute } from '../types/EntityAttribute'
import { BadRequestError } from '../errors/BadRequestError'
import { assertNever } from '../utils/typescript'

export abstract class EntityController<T extends BaseEntity> {
  readonly dao: EntityDao<T>

  protected constructor (readonly config: EntityConfig<T>) {
    this.dao = new EntityDao<T>(this.config.collectionName)
  }

  async list (req: Request, res: Response): Promise<{ items: T[] }> {
    this.validateEntityPermissions('get')
    return {
      items: await this.dao.find({}) // TODO validate permissions for individual attributes
    }
  }

  async get (req: Request, res: Response): Promise<{ item: T }> {
    this.validateEntityPermissions('get')
    const entity = await this.dao.findOneById(req.params.id)
    if (!entity) {
      throw new NotFoundError()
    }
    return { item: entity } // TODO validate permissions for individual attributes
  }

  async create (req: Request, res: Response): Promise<{ item: T }> {
    this.validateEntityPermissions('create')
    const entity = this.getEntityFromBodyRequest(req, 'create')
    const resultEntity = await this.dao.insertOne(entity)
    return { item: resultEntity }
  }

  async update (req: Request, res: Response): Promise<{ result: boolean }> {
    const entity = this.dao.findOneById(req.params.id)
    if (!entity) {
      throw new NotFoundError()
    }
    this.validateEntityPermissions('update')
    const entityData = this.getEntityFromBodyRequest(req, 'update')
    const result = await this.dao.updateOne(req.params.id, entityData)
    return { result }
  }

  async delete (req: Request, res: Response): Promise<{ result: boolean }> {
    this.validateEntityPermissions('delete')
    const result = await this.dao.deleteOne(req.params.id)
    return { result }
  }

  private getEntityFromBodyRequest (req: Request, action: 'create' | 'update'): T {
    const entity: { [key in keyof T]: any } = {} as T
    for (const [key, attribute] of Object.entries(this.config.attributes)) {
      if (this.hasValidPermissions(action, { ...this.config.permissions, ...attribute!.permissions })) {
        entity[key as keyof T] = getEntityAttribute(attribute!, key, req.body[key])
      } else {
        throw new UnauthorizedError()
      }
    }
    return entity
  }

  private validateEntityPermissions (action: keyof EntityActionPermissions) {
    if (!this.hasValidPermissions(action, this.config.permissions)) {
      throw new UnauthorizedError()
    }
  }

  // TODO only supports public permissions
  private hasValidPermissions (action: keyof EntityActionPermissions, permissions?: EntityActionPermissions) {
    if (!permissions) {
      return false
    }
    return Array.isArray(permissions[action]) ?
      permissions[action]!.includes('public') : permissions[action] === 'public'
  }
}

function getEntityAttribute (attribute: EntityAttribute, key: string, value: any) {
  if (attribute.required && !value) {
    throw new BadRequestError(`${key} is required`)
  }

  switch (attribute.type) {
    case 'string':
      return getStringEntityAttribute(attribute, key, value)
    case 'number':
      return getNumberEntityAttribute(attribute, key, value)
    default:
      assertNever(attribute)
  }
}

function getStringEntityAttribute (attribute: StringEntityAttribute, key: string, value: any) {
  const valueStr = value.toString()
  if (attribute.maxLength !== undefined && valueStr.length > attribute.maxLength) {
    throw new BadRequestError(`${key} must be shorter than ${attribute.maxLength} characters`)
  }
  return value.trim()
}

function getNumberEntityAttribute (attribute: NumberEntityAttribute, key: string, value: any) {
  const valueNum = Number(value)
  if (Number.isNaN(valueNum)) {
    throw new BadRequestError(`${key} must be a number`)
  }
  if (attribute.min !== undefined && valueNum < attribute.min) {
    throw new BadRequestError(`${key} must be larger than ${attribute.min}`)
  }
  if (attribute.max !== undefined && valueNum > attribute.max) {
    throw new BadRequestError(`${key} must be smaller than ${attribute.max}`)
  }
  return valueNum
}
