import { Commun, RegisterEntityOptions } from '@commun/core'
import { BaseUserModel } from './types/BaseUserModel'
import { BaseUserController } from './controllers/BaseUserController'
import { BaseUserRouter } from './routers/BaseUserRouter'
import { DefaultUserConfig } from './config/DefaultUserConfig'

export const UserModule = {
  setup<MODEL extends BaseUserModel> (entity: RegisterEntityOptions<MODEL>) {
    Commun.registerEntity({
      config: DefaultUserConfig,
      controller: new BaseUserController<MODEL>((entity.config || DefaultUserConfig).entityName),
      router: BaseUserRouter,
      onExpressAppCreated: async app => {
        // TODO setup passport
      },
      ...entity
    })
  }
}
