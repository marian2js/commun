import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminPluginRouter = express.Router()
  .get('/:pluginName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getPlugin(req, res)))
  .put('/:pluginName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updatePlugin(req, res)))
