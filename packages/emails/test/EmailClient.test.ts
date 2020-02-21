import { EmailClient, EmailModule, EmailTemplate } from '../src'
import nodemailer from 'nodemailer'
import { Commun, ConfigManager } from '@commun/core'
import fs from 'fs'

describe('EmailClient', () => {
  describe('sendEmail', () => {
    let transporter: nodemailer.Transporter

    beforeEach(() => {
      transporter = nodemailer.createTransport({ host: 'example.org' })
      transporter.sendMail = jest.fn(() => Promise.resolve())

      ConfigManager.setRootPath('/test/dist')
      fs.readdir = jest.fn((path: string, cb: (err: any, items: string[]) => void) =>
        cb(null, ['template.json'])) as any
    })

    afterEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
    })

    const mockTemplate = (template: EmailTemplate) => {
      jest.mock('/test/src/plugins/emails/templates/template.json', () => template, { virtual: true })
    }

    it('should send an email', async () => {
      mockTemplate({
        enabled: true,
        subject: 'Subject',
        text: 'Text'
      })

      await EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {},
      })
      await EmailClient.sendEmail('template', 'to@example.org', {})
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.org',
        to: 'to@example.org',
        subject: 'Subject',
        text: 'Text',
      })
    })

    it('should parse given variables into the subject and text', async () => {
      mockTemplate({
        enabled: true,
        subject: 'Subject {hi}!',
        text: 'Text {hi}!'
      })

      await EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {},
      })
      await EmailClient.sendEmail('template', 'to@example.org', { hi: 'test-name' })
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.org',
        to: 'to@example.org',
        subject: 'Subject test-name!',
        text: 'Text test-name!',
      })
    })

    it('should parse Commun options into the subject and text', async () => {
      mockTemplate({
        enabled: true,
        subject: 'Welcome to {appName}!',
        text: 'Check out {endpoint}'
      })

      Commun.setOptions({
        appName: 'TEST-APP',
        endpoint: 'http://example.org',
        mongoDB: { dbName: '', uri: '' }
      })
      await EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {},
      })
      await EmailClient.sendEmail('template', 'to@example.org')
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: 'from@example.org',
        to: 'to@example.org',
        subject: 'Welcome to TEST-APP!',
        text: 'Check out http://example.org',
      })
    })

    it('should not send an email if the template is not enabled', async () => {
      mockTemplate({
        enabled: false,
        subject: 'Subject',
        text: 'Text'
      })

      await EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {},
      })
      await EmailClient.sendEmail('template', 'to@example.org', {})
      expect(transporter.sendMail).not.toHaveBeenCalled()
    })

    it('should not send an email if the template does not exist', async () => {
      await EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {},
      })
      await EmailClient.sendEmail('template', 'to@example.org', {})
      expect(transporter.sendMail).not.toHaveBeenCalled()
    })

    it('should not send an email if the EmailModule was not setup', async () => {
      EmailModule.wasSetup = false
      await EmailClient.sendEmail('template', 'to@example.org', {})
      expect(transporter.sendMail).not.toHaveBeenCalled()
    })
  })
})
