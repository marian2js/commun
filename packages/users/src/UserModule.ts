import { Commun, ConfigManager, RegisterEntityOptions } from '@commun/core'
import { UserModel } from './types/UserModel'
import { UserController } from './controllers/UserController'
import { UserRouter } from './routers/UserRouter'
import { UserConfig } from './config/UserConfig'
import jwt from 'jsonwebtoken'
import { AccessTokenSecurity } from './security/AccessTokenSecurity'
import { AccessTokenKeys } from './types/UserTokens'
import { AuthProvider } from './types/ExternalAuth'
import { ExternalAuth } from './security/ExternalAuth'

export type UserModuleSettings = {
  accessToken: jwt.SignOptions,
  refreshToken: {
    enabled: boolean
  },
  externalAuth?: {
    callbackUrl: string
    autoGenerateUsername: boolean
    providers: {
      [key in AuthProvider]?: {
        enabled: boolean
      }
    }
  },
}

let userModuleSettings: UserModuleSettings
let entityName: string
let keys: AccessTokenKeys

export const UserModule = {
  async setup<MODEL extends UserModel> (options: UserModuleSettings, entityOptions?: RegisterEntityOptions<MODEL>) {
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
    Commun.registerLogsToken('user-id', req => req.auth?.id)

    Commun.registerEntity<MODEL>({
      config,
      controller: new UserController<MODEL>(config.entityName),
      router: UserRouter,
      onExpressAppCreated: app => {
        ExternalAuth.setupPassport(app)
        app.use(AccessTokenSecurity.setRequestAuthMiddleware)
      },
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

async function getUserEntityConfig<MODEL extends UserModel> () {
  const config = await ConfigManager.readEntityConfig<MODEL>('users')
  return {
    ...UserConfig,
    ...config,
    schema: {
      ...UserConfig.schema,
      ...(config.schema || {}),
      properties: {
        ...UserConfig.schema?.properties,
        ...(config.schema?.properties || {}),
      },
    },
    permissions: {
      ...UserConfig.permissions,
      ...(config.permissions || {}),
      properties: {
        ...UserConfig.permissions?.properties,
        ...(config.permissions?.properties || {}),
      }
    }
  }
}
