import { EmailModule } from '../src'
import nodemailer from 'nodemailer'
import { ConfigManager } from '@commun/core'
import fs from 'fs'

describe('EmailModule', () => {
  describe('setup', () => {
    beforeEach(() => {
      ConfigManager.setRootPath('/test/dist')
      fs.readdir = jest.fn((path: string, cb: (err: any, items: []) => void) => cb(null, [])) as any
    })

    it('should store the given options and mark the module as setup', async () => {
      expect(EmailModule.wasSetup).toBe(false)
      const options = {
        transporter: nodemailer.createTransport({ host: 'example.org' }),
        sendFrom: 'hi@example.org',
        templates: {},
      }
      await EmailModule.setup(options)
      expect(EmailModule.wasSetup).toBe(true)
      expect(EmailModule.getOptions()).toBe(options)
    })
  })
})