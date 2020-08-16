import { EntityConfig } from '@commun/core'
import { UserModel } from '..'

export const UserConfig: EntityConfig<UserModel> = {
  entityName: 'users',
  collectionName: 'users',
  apiKey: 'username',
  schema: {
    required: [
      'username',
      'email',
    ],
    properties: {
      id: {
        type: 'string',
        format: 'id',
      },
      username: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_.]*$',
        readOnly: true,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      password: {
        type: 'string',
        format: 'hash',
      },
      verified: {
        type: 'boolean',
      },
      refreshTokenHash: {
        type: 'string',
        format: 'hash',
      },
      verificationCode: {
        type: 'string',
      },
      resetPasswordCodeHash: {
        type: 'string',
        format: 'hash',
      },
      admin: {
        type: 'boolean',
        default: false,
      },
      providers: {
        type: 'object',
        properties: {
          google: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          facebook: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          github: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      }
    }
  },
  permissions: {
    properties: {
      email: {
        get: 'own',
      },
      password: {
        get: 'system',
      },
      verified: {
        get: 'own',
        create: 'admin',
        update: 'admin',
      },
      refreshTokenHash: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
      verificationCode: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
      resetPasswordCodeHash: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
      admin: {
        get: 'own',
        create: 'system',
        update: 'system',
      },
      providers: {
        get: 'system',
        create: 'system',
        update: 'system',
      },
    },
  },
  indexes: [{
    keys: {
      username: 1,
    },
    unique: true,
  }, {
    keys: {
      email: 1,
    },
    unique: true,
  }],
}
