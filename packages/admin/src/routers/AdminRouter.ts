import * as express from 'express'
import { AdminEntityRouter } from './AdminEntityRouter'
import { AdminController } from '../controllers/AdminController'
import { AdminPluginRouter } from './AdminPluginRouter'

export const AdminRouter = express.Router()
  .use('/admin/entities', new AdminController().validateAdminPermissions, AdminEntityRouter)
  .use('/admin/plugins', new AdminController().validateAdminPermissions, AdminPluginRouter)
