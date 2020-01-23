import { AdminModule } from '../src'
import { Commun, SecurityUtils } from '@commun/core'
import { AdminController } from '../src/controllers/AdminController'
import { AdminRouter } from '../src/routers/AdminRouter'
import { DefaultUserConfig } from '@commun/users'
import { startTestApp } from '@commun/test-utils'

describe('AdminModule', () => {
  describe('setup', () => {
    it('should register the plugin', async () => {
      spyOn(Commun, 'registerPlugin')

      await AdminModule.setup()
      expect(Commun.registerPlugin).toHaveBeenCalledWith('admin', {
        controller: AdminController,
        router: AdminRouter,
        afterServerStart: expect.any(Function),
      })
    })
  })

  describe('prepareFirstRun - validateFirstRunCode', () => {
    beforeEach(async () => {
      await AdminModule.setup()
      SecurityUtils.generateRandomString = jest.fn(() => Promise.resolve('secure-code'))
      Commun.registerEntity({ config: DefaultUserConfig })
      await startTestApp(Commun)
    })

    it('should setup a code if there are no users', async () => {
      await AdminModule.prepareFirstRun()
      expect(AdminModule.validateFirstRunCode('secure-code')).toBe(true)
    })

    it('should throw an error if the code is invalid', async () => {
      await AdminModule.prepareFirstRun()
      expect(() => AdminModule.validateFirstRunCode('invalid-code')).toThrow('Unauthorized Request')
    })
  })
})