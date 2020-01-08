import * as express from 'express'
import { Commun } from '../Commun'
import { sendResponse } from '../utils'

const router = express.Router()
  .get('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).list(req, res)))
  .post('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).create(req, res)))
  .get('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).get(req, res)))
  .put('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).update(req, res)))
  .delete('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).delete(req, res)))

export default router
