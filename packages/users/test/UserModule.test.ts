import { BaseUserController, BaseUserRouter, DefaultUserConfig, UserModule } from '../src'
import { Commun, ConfigManager } from '@commun/core'

describe('UserModule', () => {
  describe('setup', () => {
    const setupOptions = {
      accessToken: {
        secretOrPrivateKey: 'test-secret',
        signOptions: {}
      },
      refreshToken: {
        enabled: true
      }
    }

    beforeEach(() => {
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({ attributes: {} })) as jest.Mock
      spyOn(Commun, 'registerEntity')
    })

    it('should store the given options', async () => {
      await UserModule.setup(setupOptions)
      expect(UserModule.getOptions()).toEqual(setupOptions)
    })

    it('should register the entity using the users entity config file', async () => {
      await UserModule.setup(setupOptions)
      expect(Commun.registerEntity).toHaveBeenCalledWith({
        config: DefaultUserConfig,
        controller: expect.any(BaseUserController),
        router: BaseUserRouter,
        onExpressAppCreated: expect.any(Function)
      })
    })
  })
})
