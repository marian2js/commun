import { request } from '../utils/apiUtils'

export const PluginService = {
  async getPlugins (): Promise<{ items: Plugin[] }> {
    return request('GET', '/admin/plugins')
  },
}
