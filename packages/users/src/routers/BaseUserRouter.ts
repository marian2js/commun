import * as express from 'express'
import { Commun, sendResponse } from '@commun/core'
import { BaseUserController, BaseUserModel, UserModule } from '..'

const getController = () => Commun.getEntityController<BaseUserModel>(UserModule.entityName) as BaseUserController<BaseUserModel>

export const BaseUserRouter = express.Router()
  .post('/auth/password', (req, res, next) =>
    sendResponse(req, res, next, getController().create(req, res)))
  .post('/auth/password/login', (req, res, next) =>
    sendResponse(req, res, next, getController().loginWithPassword(req, res)))
  .post('/auth/token', (req, res, next) =>
    sendResponse(req, res, next, getController().getAccessToken(req, res)))
  .post('/auth/verify', (req, res, next) =>
    sendResponse(req, res, next, getController().verify(req, res)))
