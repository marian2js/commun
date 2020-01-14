import { EmailModule } from '../src'
import nodemailer from 'nodemailer'

describe('EmailModule', () => {
  describe('setup', () => {
    it('should store the given options and mark the module as setup', async () => {
      expect(EmailModule.wasSetup).toBe(false)
      const options = {
        templates: {},
        transporter: nodemailer.createTransport({ host: 'example.org' }),
        sendFrom: 'hi@example.org'
      }
      EmailModule.setup(options)
      expect(EmailModule.wasSetup).toBe(true)
      expect(EmailModule.getOptions()).toBe(options)
    })
  })
})