import { request } from '../utils/apiUtils'
import { EmailTemplate } from '@commun/emails'

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

  async createEmailTemplate (templateName: string, template: EmailTemplate) {
    return request('POST', `/admin/plugins/emails/templates`, {
      ...template,
      templateName,
    })
  },

  async updateEmailTemplate (templateName: string, template: EmailTemplate) {
    return request('PUT', `/admin/plugins/emails/templates/${templateName}`, template)
  },

  async deleteEmailTemplate (templateName: string) {
    return request('DELETE', `/admin/plugins/emails/templates/${templateName}`)
  }
}
