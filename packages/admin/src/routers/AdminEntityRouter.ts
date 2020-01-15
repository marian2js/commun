import * as express from 'express'
import { sendResponse } from '@commun/core'
import { AdminController } from '../controllers/AdminController'

export const AdminEntityRouter = express.Router()
  .get('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().listEntities(req, res)))
  .post('/', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().createEntity(req, res)))
  .get('/:id', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().getEntity(req, res)))
  .put('/:id', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().updateEntity(req, res)))
  .delete('/:id', (req, res, next) =>
    sendResponse(req, res, next, new AdminController().deleteEntity(req, res)))
