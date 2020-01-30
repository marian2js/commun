import { request } from '../utils/apiUtils'

export type ServerSettings = {
  environment: string
  communVersion: string
}

let serverSettings: ServerSettings

export const ServerService = {
  async getServerSettings (): Promise<ServerSettings> {
    if (!serverSettings) {
      serverSettings = await request('GET', '/admin/server')
    }
    return serverSettings
  },
}
