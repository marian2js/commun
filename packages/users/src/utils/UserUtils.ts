import { Commun, SecurityUtils } from '@commun/core'
import { BaseUserModel } from '..'

export const UserUtils = {
  async generateUniqueUsername (prefix: string) {
    let user = await Commun.getEntityDao<BaseUserModel>('users').findOne({ username: prefix })
    if (!user) {
      return prefix
    }
    let chars = 1
    let username = prefix
    while (user) {
      for (let i = 0; i < 3; i++) {
        username = `${prefix}-${SecurityUtils.generateRandomString(chars)}`
        user = await Commun.getEntityDao<BaseUserModel>('users')
          .findOne({ username })
        if (!user) {
          break
        }
      }
      chars++
    }
    return username
  }
}
