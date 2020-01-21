import { request } from '../utils/apiUtils'
import { CommunOptions } from '@commun/core'

export const SettingsService = {
  async getSettings (): Promise<{ [key: string]: CommunOptions }> {
    return request('GET', '/admin/settings')
  },

  async setSettings (environment: string, settings: CommunOptions): Promise<any> {
    return request('POST', `/admin/settings/${environment}`, settings)
  },
}
