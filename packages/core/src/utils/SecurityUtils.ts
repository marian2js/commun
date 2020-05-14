import * as bcryptjs from 'bcryptjs'
import { randomBytes } from 'crypto'

export const SecurityUtils = {
  hashWithBcrypt: async (str: string, saltRounds: number) => {
    const salt = await bcryptjs.genSalt(saltRounds)
    return bcryptjs.hash(str, salt)
  },

  bcryptHashIsValid: async (value: string, hash: string) => bcryptjs.compare(value, hash),

  generateRandomString: async (chars: number): Promise<string> => {
    const buffer = await randomBytes(chars / 2)
    return buffer.toString('hex')
  },
}