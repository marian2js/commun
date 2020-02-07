import { NextFunction, Request, Response } from 'express'
import {
  assertNever,
  BadRequestError,
  Commun,
  ConfigManager,
  EntityConfig,
  EntityModel,
  ModelAttribute,
  PluginController,
  ServerError,
  UnauthorizedError
} from '@commun/core'
import { AuthProvider, BaseUserModel } from '@commun/users'
import { AdminModule } from '../AdminModule'

export class AdminController extends PluginController {
  async validateAdminPermissions (req: Request, res: Response, next: NextFunction) {
    if (req.auth?.id) {
      const authUser = await Commun.getEntityDao('users').findOneById(req.auth.id)
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

    if (req.body.addUser) {
      ;(entityConfig.attributes as { user: ModelAttribute }).user = {
        type: 'user',
        required: true,
        index: true,
        readonly: true,
        permissions: {
          create: 'system',
          update: 'system',
        }
      }
      entityConfig.permissions = {
        get: 'anyone',
        create: 'user',
        update: 'own',
        delete: 'own',
      }
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

  async getPlugin (req: Request, res: Response) {
    const plugin = Commun.getPlugin(req.params.pluginName)
    return {
      item: plugin.config
    }
  }

  async updatePlugin (req: Request, res: Response) {
    const pluginConfig = await ConfigManager.mergePluginConfig(req.params.pluginName, req.body)
    return { item: pluginConfig }
  }

  async createOrUpdateEmailTemplate (req: Request, res: Response) {
    const templateName = req.params.templateName || req.body.templateName
    delete req.body.templateName
    await ConfigManager.setPluginFile(req.params.pluginName, `templates/${templateName}.json`, req.body)
    return { ok: true }
  }

  async deleteEmailTemplate (req: Request, res: Response) {
    await ConfigManager.deletePluginFile(req.params.pluginName, `templates/${req.params.templateName}.json`)
    return { ok: true }
  }

  /**
   * Updates the project's .env file with the variables for the provider
   */
  async updateSocialLoginCredentials (req: Request, res: Response) {
    if (!req.body.id || !req.body.secret) {
      throw new BadRequestError('ID and Secret are required')
    }
    const provider = req.params.provider as AuthProvider
    let idVariable: string
    let secretVariable: string

    switch (provider) {
      case 'google':
        idVariable = 'GOOGLE_CLIENT_ID'
        secretVariable = 'GOOGLE_CLIENT_SECRET'
        break
      case 'facebook':
        idVariable = 'FACEBOOK_APP_ID'
        secretVariable = 'FACEBOOK_APP_SECRET'
        break
      case 'github':
        idVariable = 'GITHUB_CLIENT_ID'
        secretVariable = 'GITHUB_CLIENT_SECRET'
        break
      default:
        assertNever(provider)
        throw new Error('Unknown provider')
    }

    await ConfigManager.setEnvironmentVariable({
      [idVariable]: req.body.id,
      [secretVariable]: req.body.secret,
    })

    return { ok: true }
  }

  async getCommunSettings (req: Request, res: Response) {
    return await ConfigManager.getCommunOptions()
  }

  async setCommunSettings (req: Request, res: Response) {
    await ConfigManager.setCommunOptions(req.params.env, req.body)
    return { ok: true }
  }

  async getServerSettings (req: Request, res: Response) {
    return {
      environment: process.env.NODE_ENV,
      communVersion: (process.env.npm_package_dependencies__commun_core || '').replace(/^\^/, ''),
    }
  }

  async createAdmin (req: Request, res: Response) {
    AdminModule.validateFirstRunCode(req.body.code)
    const usersEntity = Commun.getEntity<BaseUserModel>('users')
    const result = await usersEntity.controller.create(req)
    if (!result.item.id) {
      throw new ServerError('Error occurred when creating the account, please try again')
    }
    await usersEntity.dao.updateOne(result.item.id, { admin: true })
    return result
  }
}
