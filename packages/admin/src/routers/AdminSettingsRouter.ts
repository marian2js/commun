import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminSettingsRouter = express.Router()
  .get('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getCommunSettings(req, res)))
  .post('/:env', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().setCommunSettings(req, res)))
