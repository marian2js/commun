import { PluginController } from '..'
import { Module } from './Module'

export interface PluginConfig {}

export interface Plugin extends Module {
  config: PluginConfig
  controller: PluginController
}

export type RegisterPluginOptions = Partial<Plugin>
