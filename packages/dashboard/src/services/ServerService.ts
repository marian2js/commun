import { request } from '../utils/apiUtils'

export type ServerSettings = {
  startTime: number
  environment: string
  communVersion: string
}

let serverSettings: ServerSettings

export const ServerService = {
  startTime: 0,
  online: true,

  async handleServerRestart () {
    this.online = false
    await new Promise(resolve => {
      const interval = setInterval(async () => {
        try {
          const res = await request('GET', '/admin/server') as ServerSettings
          if (res.startTime !== this.startTime) {
            this.startTime = res.startTime
            this.online = true
            window.clearInterval(interval)
            resolve()
          }
        } catch {}
      }, 500)
    })
  },

  async getServerSettings (): Promise<ServerSettings> {
    if (!serverSettings) {
      serverSettings = await request('GET', '/admin/server') as ServerSettings
    }
    this.startTime = serverSettings.startTime
    return serverSettings
  },
}
