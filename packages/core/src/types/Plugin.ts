import express, { Express } from 'express'
import { PluginController, OptionalKeys } from '..'
import { Module } from './Module'

export interface Plugin extends Module {
  controller: PluginController
  router?: express.Router
  onExpressAppCreated?: (app: Express) => Promise<void> | void
}

export type RegisterPluginOptions = OptionalKeys<Plugin>
