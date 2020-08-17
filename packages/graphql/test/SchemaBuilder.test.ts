import { getAttributeGraphQLType } from '../src/SchemaBuilder'
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLString } from 'graphql'
import { EntityConfig, EntityModel } from '@commun/core'
import { GraphQLDate } from '../src/graphql-types/GraphQLDate'
import { JSONSchema7 } from 'json-schema'

describe('SchemaBuilder', () => {
  describe('getAttributeGraphQLType', () => {
    const createEntityConfig = (property: JSONSchema7): EntityConfig<EntityModel> => {
      return {
        entityName: 'test',
        collectionName: 'test',
        schema: {
          properties: {
            key: property
          }
        }
      }
    }

    it('should convert boolean to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'boolean' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLBoolean)
    })

    it('should convert email to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'string', format: 'email' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLString)
    })

    it('should convert eval to GraphQL type', async () => {
      const property: JSONSchema7 = { format: 'eval:1' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLString)
    })

    it('should convert string to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'string' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLString)
    })

    it('should convert date to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'object', format: 'date-time', }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLDate)
    })

    it('should convert id to GraphQL type', async () => {
      const property: JSONSchema7 = { format: 'id' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLID)
    })

    it('should convert numbers to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'number' }
      const config = createEntityConfig(property)
      expect(getAttributeGraphQLType(config, 'key', property, 'type', x => x))
        .toEqual(GraphQLFloat)
    })

    it('should convert lists to GraphQL type', async () => {
      const property: JSONSchema7 = { type: 'array', items: { type: 'string' } }
      const config = createEntityConfig(property)
      expect(
        getAttributeGraphQLType(config, 'key', property, 'type', x => x)?.toString())
        .toEqual('[String]')
    })

    it('should convert objects to GraphQL type', async () => {
      const property: JSONSchema7 = {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' },
        },
      }
      const config = createEntityConfig(property)
      expect(
        getAttributeGraphQLType(config, 'key', property, 'type', x => x)?.toString())
        .toEqual('Key')
    })
  })
})
