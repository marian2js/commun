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

  // Schema
  .put('/:entityName/properties/:propertyKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntityProperty(req, res)))
  .delete('/:entityName/properties/:propertyKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntityProperty(req, res)))

  // Join properties
  .put('/:entityName/joinProperties/:propertyKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntityJoinProperties(req, res)))
  .delete('/:entityName/joinProperties/:propertyKey', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntityJoinProperty(req, res)))
