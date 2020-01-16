import { NextFunction, Request, Response } from 'express'
import { BadRequestError, Commun, ConfigManager, PluginController, UnauthorizedError } from '@commun/core'
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
    // TODO
    return {}
  }

  async updateEntity (req: Request, res: Response) {
    const entityConfig = await ConfigManager.mergeEntityConfig(req.params.entityName, req.body)
    return { item: entityConfig }
  }

  async deleteEntity (req: Request, res: Response) {
    // TODO
    return {}
  }
}
