import { Commun } from '@commun/core'
import path from 'path'
import express from 'express'

export const DashboardModule = {
  async setup () {
    Commun.registerPlugin('dashboard', {
      onExpressAppCreated: (app => {
        app.use('/dashboard', express.static(path.join(__dirname, '../build')))
        app.use('/dashboard', (req, res) => {
          res.sendFile(path.join(__dirname, '../build', 'index.html'))
        })
      })
    })
  }
}
