import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { EntityConfig, EntityModel } from './types'

let srcRootPath: string
let distRootPath: string

export const ConfigManager = {
  getEntityPath (entityName: string) {
    return path.join(srcRootPath, `entities/${entityName}`)
  },

  getEntityConfigFilePath (entityName: string) {
    return path.join(srcRootPath, `entities/${entityName}/config.json`)
  },

  async readEnvConfig () {
    const configFile = (await this._readFile(path.join(srcRootPath, `config/${process.env.NODE_ENV}.json`))).toString()
    if (!configFile) {
      throw new Error(`Config file for environment ${process.env.NODE_ENV} not found`)
    }
    return JSON.parse(configFile)
  },

  async getEntityConfigs<T> () {
    const entityDirs = await this._readdir(path.join(srcRootPath, 'entities'))
    const entities = []
    for (const entity of entityDirs) {
      entities.push(await this.readEntityConfig<T>(entity))
    }
    return entities
  },

  async readEntityConfig<T> (entityName: string): Promise<EntityConfig<T>> {
    const entityConfig = (await this._readFile(this.getEntityConfigFilePath(entityName))).toString()
    if (!entityConfig) {
      throw new Error(`Config file for entity ${entityName} not found`)
    }
    return JSON.parse(entityConfig)
  },

  async setEntityConfig<T extends EntityModel> (entityName: string, config: EntityConfig<T>) {
    await (this._writeFile(this.getEntityConfigFilePath(entityName), JSON.stringify(config, null, 2)))
  },

  async mergeEntityConfig<T extends EntityModel> (entityName: string, config: { [key in keyof EntityConfig<T>]?: any }) {
    const entityConfig = await this.readEntityConfig<T>(entityName)
    for (const key of Object.keys(config)) {
      entityConfig[key as keyof EntityConfig<T>] = config[key as keyof EntityConfig<T>]
    }
    await this.setEntityConfig<T>(entityName, entityConfig)
    return entityConfig
  },

  async createEntityConfig<T extends EntityModel> (entityName: string, config: EntityConfig<T>) {
    const entityPath = this.getEntityPath(entityName)
    if (!(await this._exists(entityPath))) {
      await this._mkdir(entityPath)
    }
    await this.setEntityConfig(entityName, config)
  },

  async deleteEntity (entityName: string) {
    const entityPath = this.getEntityPath(entityName)
    if (await this._exists(entityPath)) {
      const files = await this._readdir(entityPath)
      for (const file of files) {
        await this._unlink(path.join(entityPath, file))
      }
      await this._rmdir(entityPath)
    }
  },

  getPluginPath (pluginName: string) {
    return path.join(srcRootPath, `plugins/${pluginName}`)
  },

  getPluginSetupModulePath (pluginName: string) {
    return path.join(distRootPath, `plugins/${pluginName}/setup.js`)
  },

  getPluginNames () {
    return this._readdir(path.join(srcRootPath, 'plugins'))
  },

  async runPluginSetup (pluginName: string): Promise<void> {
    const pluginSetup = this.getPluginSetupModulePath(pluginName)
    if (!pluginSetup) {
      throw new Error(`Config file for plugin ${pluginName} not found`)
    }
    return await require(pluginSetup).default()
  },

  setRootPath (path: string) {
    distRootPath = path
    srcRootPath = path.replace(/\/dist$/, '/src')
  },

  _readFile: promisify(fs.readFile),
  _writeFile: promisify(fs.writeFile),
  _unlink: promisify(fs.unlink),
  _exists: promisify(fs.exists),
  _readdir: promisify(fs.readdir),
  _mkdir: promisify(fs.mkdir),
  _rmdir: promisify(fs.rmdir),
}
