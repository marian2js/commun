import { GraphQLModule } from '../src'
import { Commun, ConfigManager } from '@commun/core'
import { getTestApp, startTestApp } from '@commun/test-utils'
import { Express } from 'express'

describe('GraphQLModule', () => {
  describe('setup', () => {
    beforeEach(() => jest.spyOn(Commun, 'registerPlugin'))
    beforeEach(() => jest.spyOn(Commun, 'registerLogsToken'))

    it('should register the plugin', async () => {
      await GraphQLModule.setup()
      expect(Commun.registerPlugin).toHaveBeenCalledWith('graphql', {
        onExpressAppCreated: expect.any(Function),
        afterServerStart: expect.any(Function),
      })
    })

    it('should register the graphql-operation log token', async () => {
      await GraphQLModule.setup()
      expect(Commun.registerLogsToken).toHaveBeenCalledWith('graphql-operation', expect.any(Function))
    })
  })

  describe('setupGraphql', () => {
    let app: Express

    beforeEach(() => {
      startTestApp(Commun)
      app = getTestApp()
      spyOn(app, 'use')
      ConfigManager._writeFile = jest.fn(() => Promise.resolve())
      ConfigManager._mkdir = jest.fn(() => Promise.resolve()) as jest.Mock
      ConfigManager._readFile = jest.fn(() => Promise.resolve('test')) as jest.Mock
      ConfigManager._exists = jest.fn(() => Promise.resolve(true)) as jest.Mock
      ConfigManager.setRootPath('/test-project/lib')
    })

    it('should start a graphql server', async () => {
      await GraphQLModule.setupGraphql(app)
      expect(app.use).toHaveBeenCalledWith('/graphql', expect.any(Function))
    })

    it('should write the schema', async () => {
      process.env.NODE_ENV = 'development'

      const app = getTestApp()
      await GraphQLModule.setupGraphql(app)
      expect(ConfigManager._writeFile)
        .toHaveBeenCalledWith('/test-project/generated/schema.graphql', expect.any(String))
    })
  })
})
