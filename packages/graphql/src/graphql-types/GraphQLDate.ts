import { GraphQLScalarType } from 'graphql'
import { parsePropertyValue } from '@commun/core'

export const GraphQLDate = new GraphQLScalarType({
  name: 'Date',
  serialize: parseDate,
  parseValue: parseDate,
  parseLiteral (ast) {
    switch (ast.kind) {
      case 'IntValue':
        return parseDate(parseInt(ast.value, 10))
      case 'StringValue':
        return parseDate(ast.value)
      default:
        return null
    }
  }
})

function parseDate (date: Date | string | number) {
  return parsePropertyValue({ type: 'object', format: 'date-time' }, date)
}
