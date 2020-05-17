import { UserUtils } from '../../src/utils/UserUtils'
import { closeTestApp, startTestApp, stopTestApp } from '@commun/test-utils'
import { Commun, ConfigManager, SecurityUtils } from '@commun/core'
import { BaseUserModel, DefaultUserConfig, UserModule } from '../../src'

describe('UserUtils', () => {
  const collectionName = 'user_utils_test'

  beforeAll(async () => {
    ConfigManager.readEntityConfig = jest.fn(() => Promise.resolve({
      ...DefaultUserConfig,
      collectionName,
    })) as jest.Mock
    ConfigManager.getKeys = jest.fn(() => Promise.resolve({ publicKey: 'public', privateKey: 'private' }))
    await UserModule.setup({
      accessToken: {},
      refreshToken: { enabled: true }
    })
    await startTestApp(Commun)
  })
  afterEach(async () => await stopTestApp(collectionName))
  afterAll(closeTestApp)

  const getDao = () => Commun.getEntityDao<BaseUserModel>('users')

  describe('generateUniqueUsername', () => {
    beforeEach(() => {
      SecurityUtils.generateRandomString = jest.fn(chars => Promise.resolve('R'.repeat(chars)))
    })

    it('should return the prefix if a username does not exist', async () => {
      expect(await UserUtils.generateUniqueUsername('test')).toBe('test')
    })

    it('should return an username with a random suffix if the username already exists', async () => {
      await getDao().insertOne({ username: 'test' } as BaseUserModel)
      expect(await UserUtils.generateUniqueUsername('test')).toBe('test-R')
    })

    it('should return an username with a longer random suffix until the username does not exist', async () => {
      await getDao().insertOne({ username: 'test' } as BaseUserModel)
      await getDao().insertOne({ username: 'test-R' } as BaseUserModel)
      await getDao().insertOne({ username: 'test-RR' } as BaseUserModel)
      expect(await UserUtils.generateUniqueUsername('test')).toBe('test-RRR')
    })
  })
})
