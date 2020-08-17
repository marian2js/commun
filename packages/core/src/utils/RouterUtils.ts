import { NextFunction, Request, Response } from 'express'
import { HttpResponseError } from '../errors'

export const sendResponse = async <T> (req: Request, res: Response, next: NextFunction, resultPromise: Promise<T>) => {
  try {
    res.send(await resultPromise)
  } catch (e) {
    if (e instanceof HttpResponseError) {
      res.status(e.statusCode).send({ error: e.message })
    } else {
      res.status(500).send({ error: 'Internal Server Error' })
    }
  }
}
