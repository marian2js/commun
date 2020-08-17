import { UserConfig, UserController, UserModule, UserRouter } from '../src'
import { Commun, ConfigManager } from '@commun/core'

describe('UserModule', () => {
  describe('setup', () => {
    const setupOptions = {
      accessToken: {},
      refreshToken: {
        enabled: true
      }
    }

    beforeEach(() => {
      ConfigManager.getKeys = jest.fn(() => Promise.resolve({ publicKey: 'public', privateKey: 'private' }))
      ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({ schema: {} })) as jest.Mock
      spyOn(Commun, 'registerEntity')
      spyOn(Commun, 'registerLogsToken')
      process.env.COMMUN_ACCESS_TOKEN_PK_PASSPHRASE = 'secret'
    })

    it('should store the given options', async () => {
      await UserModule.setup(setupOptions)
      expect(UserModule.getOptions()).toEqual(setupOptions)
    })

    it('should store the public and secret keys', async () => {
      await UserModule.setup(setupOptions)
      expect(UserModule.accessTokenKeys).toEqual({
        publicKey: 'public',
        privateKey: {
          key: 'private',
          passphrase: 'secret'
        }
      })
    })

    it('should register the entity using the users entity config file', async () => {
      await UserModule.setup(setupOptions)
      expect(Commun.registerEntity).toHaveBeenCalledWith({
        config: UserConfig,
        controller: expect.any(UserController),
        router: UserRouter,
        onExpressAppCreated: expect.any(Function)
      })
    })

    it('should register the user-id log token', async () => {
      await UserModule.setup(setupOptions)
      expect(Commun.registerLogsToken).toHaveBeenCalledWith('user-id', expect.any(Function))
    })
  })
})
