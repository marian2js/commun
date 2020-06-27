import { getAttributeGraphQLType } from '../src/SchemaBuilder'
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLString } from 'graphql'
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import { GraphQLDate } from '../src/graphql-types/GraphQLDate'

describe('SchemaBuilder', () => {
  describe('getAttributeGraphQLType', () => {
    const createEntityConfig = (attribute: ModelAttribute): EntityConfig<EntityModel & { key: ModelAttribute }> => {
      return {
        entityName: 'test',
        collectionName: 'test',
        attributes: {
          key: attribute
        }
      }
    }

    it('should convert boolean to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'boolean' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLBoolean)
    })

    it('should convert email to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'email' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLString)
    })

    it('should convert slug to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'slug', setFrom: 'test' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLString)
    })

    it('should convert string to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'string' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLString)
    })

    it('should convert date to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'date' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLDate)
    })

    it('should convert id to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'id' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLID)
    })

    it('should convert numbers to GraphQL type', async () => {
      const config = createEntityConfig({ type: 'number' })
      expect(getAttributeGraphQLType(config, 'key', config.attributes.key, 'type')).toEqual(GraphQLFloat)
    })
  })
})
