import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminServerRouter = express.Router()
  .get('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getServerSettings(req, res)))
