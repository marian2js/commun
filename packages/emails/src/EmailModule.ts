import nodemailer from 'nodemailer'
import { ConfigManager } from '@commun/core'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

export type EmailTemplate = {
  enabled: boolean
  sendFrom?: string
  subject: string
  text: string
}

type SetupEmailOptions = {
  transporter: nodemailer.Transporter,
  sendFrom: string
}

let emailModuleOptions: SetupEmailOptions
let emailTemplates: { [key: string]: EmailTemplate } = {}

export const EmailModule = {
  wasSetup: false,

  async setup (options: SetupEmailOptions) {
    emailModuleOptions = options
    await registerTemplates()
    this.wasSetup = true
  },

  getOptions () {
    return emailModuleOptions
  },

  getTemplates () {
    return emailTemplates
  }
}

async function registerTemplates () {
  const readdir = promisify(fs.readdir)
  const pluginPath = ConfigManager.getPluginPath('emails')
  const templatesPath = path.join(pluginPath, 'templates')
  const templates = await readdir(templatesPath)
  for (const template of templates) {
    emailTemplates[template.replace(/\.json$/, '')] = require(path.join(templatesPath, template))
  }
}
