import { GraphQLBoolean, GraphQLFloat, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLNonNull } from 'graphql/type/definition'
import { Request } from 'express'
import { Commun, UnauthorizedError } from '@commun/core'
import { BaseUserController, BaseUserModel } from '@commun/users'

function getUsersController () {
  return Commun.getEntityController('users') as BaseUserController<BaseUserModel>
}

const tokensType = new GraphQLObjectType({
  name: 'Tokens',
  fields: {
    accessToken: { type: new GraphQLNonNull(GraphQLString) },
    accessTokenExpiration: { type: GraphQLFloat },
    refreshToken: { type: GraphQLString },
  }
})

export const GraphQLUserController = {
  getViewer (usersEntityType: GraphQLObjectType) {
    const controller = getUsersController()
    return {
      description: 'The currently authenticated user.',
      type: new GraphQLNonNull(usersEntityType),
      resolve: async (_: any, args: any, req: Request) => {
        if (!req.auth?.id) {
          throw new UnauthorizedError()
        }
        req.params = {
          id: req.auth.id
        }
        const res = await controller.get(req, { findModelById: true })
        return res.item
      },
    }
  },

  getAccessToken () {
    const controller = getUsersController()
    return {
      description: 'Get a new access token given a refresh token.',
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        refreshToken: { type: new GraphQLNonNull(GraphQLString) },
      },
      type: new GraphQLObjectType({
        name: 'AccessToken',
        fields: {
          accessToken: { type: new GraphQLNonNull(GraphQLString) },
          accessTokenExpiration: { type: GraphQLFloat },
        }
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.getAccessToken(req)
      },
    }
  },

  login (usersEntityType: GraphQLObjectType) {
    const controller = getUsersController()
    return {
      description: 'Login using username/email and password.',
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      type: new GraphQLObjectType({
        name: 'LoginPayload',
        fields: {
          tokens: {
            type: tokensType
          },
          user: { type: new GraphQLNonNull(usersEntityType) }
        }
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.loginWithPassword(req)
      },
    }
  },

  logout () {
    const controller = getUsersController()
    return {
      description: 'Logout the current user.',
      type: new GraphQLObjectType({
        name: 'LogoutPayload',
        fields: {
          result: { type: GraphQLBoolean, }
        },
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.logout(req)
      },
    }
  },

  verifyEmail () {
    const controller = getUsersController()
    return {
      description: 'Verify an email using the verification code.',
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        code: { type: new GraphQLNonNull(GraphQLString) }
      },
      type: new GraphQLObjectType({
        name: 'VerifyPayload',
        fields: {
          result: {
            type: GraphQLBoolean,
          }
        },
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.verify(req)
      },
    }
  },

  sendResetPasswordEmail () {
    const controller = getUsersController()
    return {
      description: 'Send an email with a link for resetting the password.',
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
      },
      type: new GraphQLObjectType({
        name: 'SendResetPasswordEmailPayload',
        fields: {
          result: { type: GraphQLBoolean }
        },
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.forgotPassword(req)
      },
    }
  },

  resetPassword () {
    const controller = getUsersController()
    return {
      description: 'Reset a password using a verification code.',
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        code: { type: new GraphQLNonNull(GraphQLString) },
      },
      type: new GraphQLObjectType({
        name: 'ResetPasswordPayload',
        fields: {
          result: { type: GraphQLBoolean }
        },
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.body = args || {}
        return await controller.resetPassword(req)
      },
    }
  },

  completeSocialAuthentication (usersEntityType: GraphQLObjectType) {
    const controller = getUsersController()
    return {
      description: 'Reset a password using a verification code.',
      args: {
        provider: { type: new GraphQLNonNull(GraphQLString) },
        code: { type: new GraphQLNonNull(GraphQLString) },
        username: { type: GraphQLString },
      },
      type: new GraphQLObjectType({
        name: 'CompleteSocialAuthenticationPayload',
        fields: {
          tokens: {
            type: tokensType
          },
          user: { type: new GraphQLNonNull(usersEntityType) }
        }
      }),
      resolve: async (_: any, args: any, req: Request) => {
        req.params = {
          provider: args.provider
        }
        delete args.provider
        req.body = args || {}
        return await controller.generateAccessTokenForAuthWithProvider(req)
      },
    }
  },
}
