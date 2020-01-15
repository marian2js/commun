import * as express from 'express'
import { AdminEntityRouter } from './AdminEntityRouter'
import { AdminController } from '../controllers/AdminController'

export const AdminRouter = express.Router()
  .use((req, res, next) => new AdminController().validateAdminPermissions(req, res, next))
  .use('/admin/entities', AdminEntityRouter)
