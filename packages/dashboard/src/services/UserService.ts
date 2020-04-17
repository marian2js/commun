import { request, STORE_TOKENS_KEY, STORE_USER_KEY } from '../utils/apiUtils'
import { BaseUserModel } from '@commun/users'

export const UserService = {
  getUserData (): BaseUserModel | null {
    const userData = localStorage.getItem(STORE_USER_KEY)
    if (userData) {
      return JSON.parse(userData)
    }
    return null
  },

  async login (data: { username: string, password: string }) {
    const res = await request('POST', '/auth/password/login', data)
    localStorage.setItem(STORE_USER_KEY, JSON.stringify(res.user))
    localStorage.setItem(STORE_TOKENS_KEY, JSON.stringify(res.tokens))
    return res
  },

  async logout () {
    await request('POST', '/auth/logout')
    localStorage.removeItem(STORE_USER_KEY)
    localStorage.removeItem(STORE_TOKENS_KEY)
  },

  async register (data: { email: string, username: string, password: string, code: string }) {
    await request('POST', '/admin', data)
    return await this.login({ username: data.username, password: data.password })
  },
}
