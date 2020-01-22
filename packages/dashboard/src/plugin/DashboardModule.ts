import { Commun } from '@commun/core'
import path from 'path'

export const DashboardModule = {
  async setup () {
    Commun.registerPlugin('dashboard', {
      onExpressAppCreated: (app => {
        app.use('/dashboard', (req, res) => {
          res.sendFile(path.join(__dirname, '../build', 'index.html'))
        })
      })
    })
  }
}
