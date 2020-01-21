import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminPluginRouter = express.Router()
  .get('/:pluginName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getPlugin(req, res)))
  .put('/:pluginName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updatePlugin(req, res)))
  .post('/:pluginName/templates', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().createOrUpdateEmailTemplate(req, res)))
  .put('/:pluginName/templates/:templateName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().createOrUpdateEmailTemplate(req, res)))
  .delete('/:pluginName/templates/:templateName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEmailTemplate(req, res)))
