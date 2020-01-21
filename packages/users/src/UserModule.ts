import { Commun, ConfigManager, RegisterEntityOptions } from '@commun/core'
import { BaseUserModel } from './types/BaseUserModel'
import { BaseUserController } from './controllers/BaseUserController'
import { BaseUserRouter } from './routers/BaseUserRouter'
import { DefaultUserConfig } from './config/DefaultUserConfig'
import jwt from 'jsonwebtoken'
import { AccessTokenSecurity } from './security/AccessTokenSecurity'

type UserModuleOptions = {
  accessToken: {
    secretOrPrivateKey: jwt.Secret,
    secretOrPublicKey?: jwt.Secret | jwt.GetPublicKeyOrSecret,
    signOptions: jwt.SignOptions,
  }
  refreshToken: {
    enabled: boolean
  }
}

let userModuleOptions: UserModuleOptions
let entityName: string

export const UserModule = {
  async setup<MODEL extends BaseUserModel> (options: UserModuleOptions, entityOptions?: RegisterEntityOptions<MODEL>) {
    const config = entityOptions?.config || await getUserEntityConfig<MODEL>()
    entityName = config.entityName
    this.setOptions(options)

    Commun.registerEntity<MODEL>({
      config,
      controller: new BaseUserController<MODEL>(config.entityName),
      router: BaseUserRouter,
      onExpressAppCreated: app => { app.use(AccessTokenSecurity.setRequestAuthMiddleware) },
      ...entityOptions
    })
  },

  getOptions () {
    return userModuleOptions
  },

  setOptions (options: UserModuleOptions) {
    userModuleOptions = options
  },

  get entityName () {
    return entityName
  },
}

async function getUserEntityConfig<MODEL extends BaseUserModel> () {
  const config = await ConfigManager.readEntityConfig<MODEL>('users')
  return {
    ...DefaultUserConfig,
    ...config,
    attributes: {
      ...DefaultUserConfig.attributes,
      ...config.attributes
    }
  }
}
