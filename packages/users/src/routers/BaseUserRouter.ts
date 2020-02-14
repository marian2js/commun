import * as express from 'express'
import { Commun, sendResponse } from '@commun/core'
import { BaseUserController, BaseUserModel, UserModule } from '..'

const getController = () => Commun.getEntityController<BaseUserModel>(UserModule.entityName) as BaseUserController<BaseUserModel>

export const BaseUserRouter = express.Router()
  .post('/auth/password', (req, res, next) =>
    sendResponse(req, res, next, getController().create(req)))
  .post('/auth/password/login', (req, res, next) =>
    sendResponse(req, res, next, getController().loginWithPassword(req)))
  .post('/auth/logout', (req, res, next) =>
    sendResponse(req, res, next, getController().logout(req)))
  .post('/auth/token', (req, res, next) =>
    sendResponse(req, res, next, getController().getAccessToken(req)))
  .post('/auth/verify', (req, res, next) =>
    sendResponse(req, res, next, getController().verify(req)))
  .post('/auth/password/forgot', (req, res, next) =>
    sendResponse(req, res, next, getController().forgotPassword(req)))
  .post('/auth/password/reset', (req, res, next) =>
    sendResponse(req, res, next, getController().resetPassword(req)))

  .get('/auth/:provider', (req, res, next) =>
    getController().startAuthWithProvider(req, res, next))
  .get('/auth/:provider/callback',
    (req, res, next) =>
      getController().authenticateWithProvider(req, res, next),
    (req, res, next) =>
      getController().completeAuthWithProvider(req, res))
  .post('/auth/:provider/token', (req, res, next) =>
    sendResponse(req, res, next, getController().generateAccessTokenForAuthWithProvider(req)))
