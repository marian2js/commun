import * as express from 'express'
import { AdminEntityRouter } from './AdminEntityRouter'
import { AdminController } from '../controllers/AdminController'
import { AdminPluginRouter } from './AdminPluginRouter'
import { AdminSettingsRouter } from './AdminSettingsRouter'
import { AdminServerRouter } from './AdminServerRouter'
import { sendResponse } from '@commun/core'

export const AdminRouter = express.Router()
  .use('/admin/entities', new AdminController().validateAdminPermissions, AdminEntityRouter)
  .use('/admin/plugins', new AdminController().validateAdminPermissions, AdminPluginRouter)
  .use('/admin/settings', new AdminController().validateAdminPermissions, AdminSettingsRouter)
  .use('/admin/server', new AdminController().validateAdminPermissions, AdminServerRouter)

  .post('/admin', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().createAdmin(req, res)))
