import { EntityConfig } from '@commun/core'
import { BaseUserModel } from '..'

export const DefaultUserConfig: EntityConfig<BaseUserModel> = {
  entityName: 'users',
  collectionName: 'users',
  apiKey: 'username',
  attributes: {
    _id: {
      type: 'user'
    },
    username: {
      type: 'string',
      required: true,
      unique: true,
      readonly: true,
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
    },
    admin: {
      type: 'boolean',
      default: false,
      permissions: {
        get: 'own',
        create: 'system',
        update: 'system',
      },
    },
    providers: {
      type: 'map',
      keyType: {
        type: 'enum',
        values: ['google']
      },
      valueType: {
        type: 'map',
        keyType: {
          type: 'string'
        },
        valueType: {
          type: 'string'
        }
      },
      permissions: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
    }
  },
}
