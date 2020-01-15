import { Commun } from '@commun/core'
import { AdminRouter } from './routers/AdminRouter'
import { AdminController } from './controllers/AdminController'

export const AdminModule = {
  setup () {
    Commun.registerPlugin('admin', {
      controller: AdminController,
      router: AdminRouter,
    })
  }
}
