import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { EntityConfig, EntityModel } from './types'

let rootPath: string

export const ConfigManager = {
  getEntityConfigFilePath (entityName: string) {
    return path.join(rootPath, `entities/${entityName}/config.json`)
  },

  async readEnvConfig () {
    const configFile = (await this.readFile(path.join(rootPath, `config/${process.env.NODE_ENV}.json`))).toString()
    if (!configFile) {
      throw new Error(`Config file for environment ${process.env.NODE_ENV} not found`)
    }
    return JSON.parse(configFile)
  },

  async readEntityConfig<T> (entityName: string): Promise<EntityConfig<T>> {
    const entityConfig = (await this.readFile(this.getEntityConfigFilePath(entityName))).toString()
    if (!entityConfig) {
      throw new Error(`Config file for entity ${entityName} not found`)
    }
    return JSON.parse(entityConfig)
  },

  async setEntityConfig<T extends EntityModel> (entityName: string, config: EntityConfig<T>) {
    await (this.writeFile(this.getEntityConfigFilePath(entityName), JSON.stringify(config, null, 2)))
  },

  async mergeEntityConfig<T extends EntityModel> (entityName: string, config: { [key in keyof EntityConfig<T>]?: any }) {
    const entityConfig = await this.readEntityConfig<T>(entityName)
    for (const key of Object.keys(config)) {
      entityConfig[key as keyof EntityConfig<T>] = config[key as keyof EntityConfig<T>]
    }
    await this.setEntityConfig<T>(entityName, entityConfig)
    return entityConfig
  },

  setRootPath (path: string) {
    rootPath = path.replace(/\/dist$/, '/src')
  },

  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
}
