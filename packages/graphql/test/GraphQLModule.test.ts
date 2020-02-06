import { GraphQLModule } from '../src'
import { Commun, ConfigManager } from '@commun/core'
import { getTestApp, startTestApp } from '@commun/test-utils'
import { Express } from 'express'

describe('GraphQLModule', () => {
  describe('setup', () => {
    beforeEach(() => jest.spyOn(Commun, 'registerPlugin'))

    it('should register the plugin', async () => {
      await GraphQLModule.setup()
      expect(Commun.registerPlugin).toHaveBeenCalledWith('graphql', {
        onExpressAppCreated: expect.any(Function)
      })
    })
  })

  describe('setupGraphql', () => {
    let app: Express

    beforeEach(() => {
      startTestApp(Commun)
      app = getTestApp()
      spyOn(app, 'use')
      GraphQLModule._writeFile = jest.fn(() => Promise.resolve())
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
      expect(GraphQLModule._writeFile)
        .toHaveBeenCalledWith('/test-project/schema.graphql', expect.any(String))
    })
  })
})
