import * as express from 'express'
import { Commun } from '../Commun'
import { sendResponse } from '../utils'

const router = express.Router()
  .get('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).list(req)))
  .post('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).create(req)))
  .get('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).get(req)))
  .put('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).update(req)))
  .delete('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).delete(req)))

export default router
