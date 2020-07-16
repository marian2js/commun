import { Commun, SecurityUtils, UnauthorizedError } from '@commun/core'
import { AdminRouter } from './routers/AdminRouter'
import { AdminController } from './controllers/AdminController'

let firstRunCode: string | undefined
let serverStartTime: number

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
      firstRunCode = SecurityUtils.generateRandomString(36)
      console.log(`    🔑 Register your first admin account: ${Commun.getOptions().endpoint}/dashboard/signup?code=${firstRunCode}`)
      console.log()
    }
    serverStartTime = new Date().getTime()
  },

  validateFirstRunCode (code: string) {
    if (!firstRunCode || code !== firstRunCode) {
      throw new UnauthorizedError()
    }
    return true
  },

  getServerStartTime () {
    return serverStartTime
  },
}
