import { GraphQLModule } from '../src'
import { Commun } from '@commun/core'

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
})
