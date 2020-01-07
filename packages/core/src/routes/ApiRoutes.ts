import * as express from 'express'
import { NextFunction, Request, Response } from 'express'
import { Commun } from '../Commun'

const sendResponse = async <T> (req: Request, res: Response, next: NextFunction, resultPromise: Promise<T>) => {
  try {
    res.send(await resultPromise)
  } catch (e) {
    next(e)
  }
}

const router = express.Router()
  .get('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getController(req.params.entity).list(req, res)))
  .post('/:entity', (req, res, next) =>
    sendResponse(req, res, next, Commun.getController(req.params.entity).create(req, res)))
  .get('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getController(req.params.entity).get(req, res)))
  .put('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getController(req.params.entity).update(req, res)))
  .delete('/:entity/:id', (req, res, next) =>
    sendResponse(req, res, next, Commun.getController(req.params.entity).delete(req, res)))

export default router
