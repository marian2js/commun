import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminEntityRouter = express.Router()
  .get('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().listEntities(req, res)))
  .post('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().createEntity(req, res)))
  .get('/:entityName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getEntity(req, res)))
  .put('/:entityName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntity(req, res)))
  .delete('/:entityName', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntity(req, res)))

  // Attributes
  .put('/:entityName/attributes/:attributeKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntityAttribute(req, res)))
  .delete('/:entityName/attributes/:attributeKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntityAttribute(req, res)))

  // Join attributes
  .put('/:entityName/joinAttributes/:attributeKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntityJoinAttribute(req, res)))
  .delete('/:entityName/joinAttributes/:attributeKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntityJoinAttribute(req, res)))
