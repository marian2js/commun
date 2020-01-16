import * as express from 'express'
import { AdminEntityRouter } from './AdminEntityRouter'
import { AdminController } from '../controllers/AdminController'

export const AdminRouter = express.Router()
  .use('/admin/entities', new AdminController().validateAdminPermissions, AdminEntityRouter)
