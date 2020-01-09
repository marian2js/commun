import { Commun, OptionalKeys, RegisterEntityOptions } from '@commun/core'
import { BaseUserModel } from './types/BaseUserModel'
import { BaseUserController } from './controllers/BaseUserController'
import { BaseUserRouter } from './routers/BaseUserRouter'
import { DefaultUserConfig } from './config/DefaultUserConfig'
import jwt from 'jsonwebtoken'
import { AccessTokenSecurity } from './security/AccessTokenSecurity'

type UserModuleRequiredOptions = {
  accessToken: {
    secretOrPrivateKey: jwt.Secret,
  }
}

type UserModuleDefaultOptions = {
  accessToken: {
    secretOrPublicKey?: jwt.Secret | jwt.GetPublicKeyOrSecret,
    signOptions?: jwt.SignOptions
  }
  refreshToken: {
    enabled: boolean
  }
}

type UserModuleOptions = UserModuleRequiredOptions & UserModuleDefaultOptions

type UserModuleOptionsWithOptionalDefaults = UserModuleRequiredOptions & OptionalKeys<UserModuleDefaultOptions>

let userModuleOptions: UserModuleOptions
let entityName: string

let defaultOptions: UserModuleDefaultOptions = {
  accessToken: {
    signOptions: {
      expiresIn: '3 days'
    },
  },
  refreshToken: {
    enabled: true
  },
}

export const UserModule = {
  setup<MODEL extends BaseUserModel> (entityOptions: RegisterEntityOptions<MODEL>, options: UserModuleOptionsWithOptionalDefaults) {
    const config = entityOptions.config || DefaultUserConfig
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

  setOptions (options: UserModuleOptionsWithOptionalDefaults) {
    userModuleOptions = {
      accessToken: {
        ...defaultOptions.accessToken,
        ...options.accessToken,
      },
      refreshToken: {
        ...defaultOptions.refreshToken,
        ...options.refreshToken,
      },
    }
  },

  get entityName () {
    return entityName
  },
}
