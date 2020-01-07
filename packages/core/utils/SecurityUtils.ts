import * as bcryptjs from 'bcryptjs'

export const SecurityUtils = {
  hashWithBcrypt: async (str: string, saltRounds: number) => {
    const salt = await bcryptjs.genSalt(saltRounds)
    return bcryptjs.hash(str, salt)
  },

  bcryptHashIsValid: async (value: string, hash: string) => bcryptjs.compare(value, hash)
}
