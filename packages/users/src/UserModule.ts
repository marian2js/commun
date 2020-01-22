import { Commun, ConfigManager, RegisterEntityOptions } from '@commun/core'
import { BaseUserModel } from './types/BaseUserModel'
import { BaseUserController } from './controllers/BaseUserController'
import { BaseUserRouter } from './routers/BaseUserRouter'
import { DefaultUserConfig } from './config/DefaultUserConfig'
import jwt from 'jsonwebtoken'
import { AccessTokenSecurity } from './security/AccessTokenSecurity'
import { AccessTokenKeys } from './types/UserTokens'

export type UserModuleSettings = {
  accessToken: jwt.SignOptions,
  refreshToken: {
    enabled: boolean
  }
}

let userModuleSettings: UserModuleSettings
let entityName: string
let keys: AccessTokenKeys

export const UserModule = {
  async setup<MODEL extends BaseUserModel> (options: UserModuleSettings, entityOptions?: RegisterEntityOptions<MODEL>) {
    const config = entityOptions?.config || await getUserEntityConfig<MODEL>()
    entityName = config.entityName

    const { publicKey, privateKey } = await ConfigManager.getKeys('accessToken')
    this.accessTokenKeys = {
      publicKey,
      privateKey: {
        key: privateKey,
        passphrase: process.env.COMMUN_ACCESS_TOKEN_PK_PASSPHRASE!,
      }
    }

    this.setOptions(options)

    Commun.registerEntity<MODEL>({
      config,
      controller: new BaseUserController<MODEL>(config.entityName),
      router: BaseUserRouter,
      onExpressAppCreated: app => { app.use(AccessTokenSecurity.setRequestAuthMiddleware) },
      ...entityOptions
    })
    await Commun.registerPlugin('users', { config: options })
  },

  getOptions () {
    return userModuleSettings
  },

  setOptions (options: UserModuleSettings) {
    userModuleSettings = options
  },

  get accessTokenKeys () {
    return keys
  },

  set accessTokenKeys (accessTokenKeys: AccessTokenKeys) {
    keys = accessTokenKeys
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
