import nodemailer from 'nodemailer'

export type EmailTemplate = {
  enabled: boolean
  sendFrom?: string
  subject: string
  text: string
}

type SetupEmailOptions = {
  templates: {
    [key: string]: EmailTemplate
  }
  transporter: nodemailer.Transporter,
  sendFrom: string
}

let emailModuleOptions: SetupEmailOptions

export const EmailModule = {
  wasSetup: false,

  setup (options: SetupEmailOptions) {
    emailModuleOptions = options
    this.wasSetup = true
  },

  getOptions () {
    return emailModuleOptions
  },
}
