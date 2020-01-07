import * as express from 'express'
import { Request, Response } from 'express'
import { Commun } from '../Commun'
import { HttpResponseError } from '../errors/HttpResponseError'

const processResponse = async <T> (req: Request, res: Response, resultPromise: Promise<T>) => {
  try {
    const result = await resultPromise
    res.send(result)
  } catch (e) {
    if (e instanceof HttpResponseError) {
      return res.status(e.statusCode).send({ error: e.message })
    }
    console.log(e)
    res.status(500).send('Bad Request')
  }
}

const router = express.Router()
  .get('/:entity', (req, res) =>
    processResponse(req, res, Commun.getController(req.params.entity).list(req, res)))
  .post('/:entity', (req, res) =>
    processResponse(req, res, Commun.getController(req.params.entity).create(req, res)))
  .get('/:entity/:id', (req, res) =>
    processResponse(req, res, Commun.getController(req.params.entity).get(req, res)))
  .put('/:entity/:id', (req, res) =>
    processResponse(req, res, Commun.getController(req.params.entity).update(req, res)))
  .delete('/:entity/:id', (req, res) =>
    processResponse(req, res, Commun.getController(req.params.entity).delete(req, res)))

export default router
