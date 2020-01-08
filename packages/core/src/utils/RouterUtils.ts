import { NextFunction, Request, Response } from 'express'

export const sendResponse = async <T> (req: Request, res: Response, next: NextFunction, resultPromise: Promise<T>) => {
  try {
    res.send(await resultPromise)
  } catch (e) {
    next(e)
  }
}
