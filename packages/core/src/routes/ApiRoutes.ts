import * as express from 'express'
import { Commun } from '../Commun'
import { sendResponse } from '../utils'

const router = express.Router()
  .get('/ping', (req, res) => res.send({ response: 'OK' }))

  .get('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).list(req, 'all')))
  .post('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).create(req)))
  .get('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).get(req)))
  .put('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).update(req)))
  .delete('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getEntityController(req.params.entity).delete(req)))

export default router
