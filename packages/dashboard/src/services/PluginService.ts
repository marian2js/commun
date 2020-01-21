import { request } from '../utils/apiUtils'

export const PluginService = {
  async getPlugins (): Promise<{ items: Plugin[] }> {
    return request('GET', '/admin/plugins')
  },

  async getPlugin<T> (pluginName: string): Promise<{ item: T }> {
    return request('GET', `/admin/plugins/${pluginName}`)
  },

  async updatePlugin<T> (pluginName: string, data: T): Promise<{ item: T }> {
    return request('PUT', `/admin/plugins/${pluginName}`, data)
  },
}
