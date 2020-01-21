import express, { Express } from 'express'
import { OptionalKeys, PluginController } from '..'
import { Module } from './Module'

export interface PluginConfig {}

export interface Plugin extends Module {
  config: PluginConfig
  controller: PluginController
  router?: express.Router
  onExpressAppCreated?: (app: Express) => Promise<void> | void
}

export type RegisterPluginOptions = OptionalKeys<Plugin>
