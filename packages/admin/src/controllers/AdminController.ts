import { NextFunction, Request, Response } from 'express'
import {
  BadRequestError,
  Commun,
  ConfigManager,
  EntityConfig,
  EntityModel,
  PluginController,
  UnauthorizedError
} from '@commun/core'
import { BaseUserModel } from '@commun/users'

export class AdminController extends PluginController {
  async validateAdminPermissions (req: Request, res: Response, next: NextFunction) {
    if (req.auth?._id) {
      const authUser = await Commun.getEntityDao('users').findOneById(req.auth._id)
      if (authUser && (authUser as BaseUserModel).admin) {
        return next()
      }
    }
    next(new UnauthorizedError())
  }

  async listEntities (req: Request, res: Response) {
    const entities = Commun.getEntities()
    return {
      items: Object.values(entities).map(entity => entity.config)
    }
  }

  async getEntity (req: Request, res: Response) {
    const entity = Commun.getEntity(req.params.entityName)
    return {
      item: entity.config
    }
  }

  async createEntity (req: Request, res: Response) {
    if (!req.body.entityName) {
      throw new BadRequestError('Entity name must be provided')
    }
    const entityConfig: EntityConfig<EntityModel> = {
      entityName: req.body.entityName,
      collectionName: req.body.collectionName || req.body.entityName,
      attributes: {},
    }
    await ConfigManager.createEntityConfig(req.body.entityName, entityConfig)
    return {
      item: entityConfig
    }
  }

  async updateEntity (req: Request, res: Response) {
    const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, req.body)
    return { item: entityConfig }
  }

  async deleteEntity (req: Request, res: Response) {
    await ConfigManager.deleteEntity(req.params.entityName)
    return { ok: true }
  }

  async updateEntityAttribute (req: Request, res: Response) {
    const originalEntityConfig = await ConfigManager.readEntityConfig(req.params.entityName)
    const attributes = {
      ...originalEntityConfig.attributes,
      [req.params.attributeKey]: req.body
    }
    const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, { attributes })
    return { item: entityConfig }
  }

  async deleteEntityAttribute (req: Request, res: Response) {
    const originalEntityConfig = await ConfigManager.readEntityConfig<EntityModel>(req.params.entityName)
    const attributes = originalEntityConfig.attributes
    delete attributes[req.params.attributeKey as keyof EntityModel]
    const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, { attributes })
    return { item: entityConfig }
  }

  async updateEntityJoinAttribute (req: Request, res: Response) {
    const originalEntityConfig = await ConfigManager.readEntityConfig(req.params.entityName)
    const joinAttributes = {
      ...originalEntityConfig.joinAttributes,
      [req.params.attributeKey]: req.body
    }
    const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, { joinAttributes })
    return { item: entityConfig }
  }

  async deleteEntityJoinAttribute (req: Request, res: Response) {
    const originalEntityConfig = await ConfigManager.readEntityConfig<EntityModel>(req.params.entityName)
    const joinAttributes = originalEntityConfig.joinAttributes
    if (joinAttributes) {
      delete joinAttributes[req.params.attributeKey]
      const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, { joinAttributes })
      return { item: entityConfig }
    }
    return { item: originalEntityConfig }
  }
}
