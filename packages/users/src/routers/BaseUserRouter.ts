import * as express from 'express'
import { Commun, sendResponse } from '@commun/core'
import { BaseUserController, BaseUserModel } from '..'

const getController = () => Commun.getEntityController('users') as BaseUserController<BaseUserModel>

export const BaseUserRouter = express.Router()
  .post('/users/:username/verify', (req, res, next) =>
    sendResponse(req, res, next, getController().verify(req, res)))
