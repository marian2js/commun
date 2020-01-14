import { EmailClient, EmailModule } from '../src'
import nodemailer from 'nodemailer'
import { Commun } from '@commun/core'

describe('EmailClient', () => {
  describe('sendEmail', () => {
    let transporter: nodemailer.Transporter

    beforeEach(() => {
      transporter = nodemailer.createTransport({ host: 'example.org' })
      transporter.sendMail = jest.fn(() => Promise.resolve())
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should send an email', async () => {
      EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {
          template: {
            enabled: true,
            subject: 'Subject',
            text: 'Text'
          }
        },
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
      EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {
          template: {
            enabled: true,
            subject: 'Subject {hi}!',
            text: 'Text {hi}!'
          }
        },
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
      Commun.setOptions({
        appName: 'TEST-APP',
        endpoint: 'http://example.org',
        mongoDB: { dbName: '', uri: '' }
      })
      EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {
          template: {
            enabled: true,
            subject: 'Welcome to {appName}!',
            text: 'Check out {endpoint}'
          }
        },
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
      EmailModule.setup({
        sendFrom: 'from@example.org',
        transporter,
        templates: {
          template: {
            enabled: false,
            subject: 'Subject',
            text: 'Text'
          }
        },
      })
      await EmailClient.sendEmail('template', 'to@example.org', {})
      expect(transporter.sendMail).not.toHaveBeenCalled()
    })

    it('should not send an email if the template does not exist', async () => {
      EmailModule.setup({
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
