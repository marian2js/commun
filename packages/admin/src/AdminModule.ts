import { Commun, SecurityUtils, UnauthorizedError } from '@commun/core'
import { AdminRouter } from './routers/AdminRouter'
import { AdminController } from './controllers/AdminController'

let firstRunCode: string | undefined

export const AdminModule = {
  async setup () {
    Commun.registerPlugin('admin', {
      controller: AdminController,
      router: AdminRouter,
      afterServerStart: () => this.prepareFirstRun(),
    })
  },

  async prepareFirstRun () {
    let dao
    try {
      dao = Commun.getEntityDao('users')
    } catch (e) {
      throw new Error('Admin plugin depends on users entity')
    }
    if (!await dao.getEstimatedCount()) {
      firstRunCode = await SecurityUtils.generateRandomString(36)
      console.log()
      console.log('🙏 Thank you for setting up your Commun server')
      console.log()
      console.log('🔑 To get started you need to register an admin account:')
      console.log()
      console.log(`${Commun.getOptions().endpoint}/dashboard/signup?code=${firstRunCode}`)
      console.log()
    }
  },

  validateFirstRunCode (code: string) {
    if (!firstRunCode || code !== firstRunCode) {
      throw new UnauthorizedError()
    }
    return true
  }
}
