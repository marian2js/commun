import { EntityConfig } from '@commun/core'
import { BaseUserModel } from '..'

export const DefaultUserConfig: EntityConfig<BaseUserModel> = {
  entityName: 'users',
  collectionName: 'users',
  apiKey: 'username',
  attributes: {
    username: {
      type: 'string',
      required: true,
      unique: true,
    },
    email: {
      type: 'email',
      required: true,
      unique: true,
      permissions: {
        get: 'own',
      }
    },
    password: {
      type: 'string',
      required: true,
      hash: {
        algorithm: 'bcrypt',
        salt_rounds: 12,
      },
      permissions: {
        get: 'system',
      },
    },
    verified: {
      type: 'boolean',
      permissions: {
        get: 'own',
        create: 'admin',
        update: 'admin',
      },
    },
    refreshTokenHash: {
      type: 'string',
      hash: {
        algorithm: 'bcrypt',
        salt_rounds: 12,
      },
      permissions: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
    },
    verificationCode: {
      type: 'string',
      permissions: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
    },
    resetPasswordCodeHash: {
      type: 'string',
      hash: {
        algorithm: 'bcrypt',
        salt_rounds: 12,
      },
      permissions: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
    }
  },
}
