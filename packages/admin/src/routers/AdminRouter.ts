import * as express from 'express'
import { AdminEntityRouter } from './AdminEntityRouter'
import { AdminController } from '../controllers/AdminController'
import { AdminPluginRouter } from './AdminPluginRouter'
import { AdminSettingsRouter } from './AdminSettingsRouter'

export const AdminRouter = express.Router()
  .use('/admin/entities', new AdminController().validateAdminPermissions, AdminEntityRouter)
  .use('/admin/plugins', new AdminController().validateAdminPermissions, AdminPluginRouter)
  .use('/admin/settings', new AdminController().validateAdminPermissions, AdminSettingsRouter)
