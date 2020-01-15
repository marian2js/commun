import express, { Express } from 'express'

export interface Module {
  router?: express.Router
  onExpressAppCreated?: (app: Express) => Promise<void> | void
}
