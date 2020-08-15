import { Commun } from '../Commun'
import { ServerError } from '../errors'
import { EntityModel } from '../types'
import { getEntityRef, isEntityRef, parsePropertyValue } from './entitySchema'
import * as mathjs from 'mathjs'
import { JSONSchema7Definition } from 'json-schema'
import { SecurityUtils } from '../utils'

// Create mathjs parser and set functions
const parser = mathjs.parser()
parser.set('slug', (value: string) => {
  if (!value) {
    return value
  }
  return value.toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
})
parser.set('randomChars', SecurityUtils.generateRandomString)

export async function parseConfigString<T extends EntityModel> (str: string, entityName: string, model: T, userId?: string) {
  const expressions = str.match(/{([^}]+)}/g)
  if (!expressions) {
    return str
  }
  if (expressions.length === 1 && /^{.*}$/.test(str.trim())) {
    return getConfigExpressionValue(expressions[0].trim().slice(1, -1).trim(), entityName, model, userId)
  }
  for (const expression of expressions) {
    const value = await getConfigExpressionValue(expression.trim().slice(1, -1).trim(), entityName, model, userId)
    str = str.replace(expression, value ? '' + value : '')
  }
  return str
}

export function getVariableData<T extends EntityModel> (variable: string, entityName: string, model: T, userId?: string) {
  const variableParts = variable.split('.')
  if (variableParts[0] === 'user') {
    if (!userId) {
      return
    }
    return {
      variableValue: variableParts[1] === 'id' ? userId : undefined,
      variableEntity: 'users',
      variableId: userId,
      variableKey: variableParts[1],
      variableProperty: Commun.getEntityConfig('users').schema.properties?.[variableParts[1]],
    }
  }
  if (variableParts[0] !== 'this') {
    throw new ServerError(`Invalid variable ${variable} on ${entityName} config`)
  }
  const config = Commun.getEntityConfig(entityName)
  const propertyEntries = Object.entries(config.schema.properties || {})
    .find((([key, _]) => key === variableParts[1]))
  if (!propertyEntries || !propertyEntries[1]) {
    throw new ServerError(`Invalid variable ${variable} on ${entityName} config`)
  }
  let variableEntity
  let variableId
  let variableKey
  let variableProperty
  let variableValue

  if (variableParts.length === 3 && isEntityRef(propertyEntries[1])) {
    const id = model[variableParts[1] as keyof T]
    variableId = id ? '' + id : undefined
    variableEntity = getEntityRef(propertyEntries[1])!
    variableKey = variableParts[2]
    variableProperty = Commun.getEntityConfig(variableEntity).schema.properties?.[variableKey]
  } else {
    variableEntity = entityName
    variableId = model.id!
    variableKey = variableParts[1]
    variableProperty = propertyEntries[1]
    variableValue = model[variableKey as keyof T]
  }

  return {
    variableProperty,
    variableEntity,
    variableId,
    variableKey,
    variableValue,
  }
}

async function getConfigExpressionValue<T extends EntityModel> (expression: string, entityName: string, model: T, userId?: string) {
  const variables = expression.match(/([a-zA-Z][\w.]+)/g)

  if (variables && variables[0] === expression) {
    return getConfigVariableValue(expression, entityName, model, userId)
  }

  if (variables) {
    for (const variable of variables) {
      if (variable.includes('.')) {
        const value = await getConfigVariableValue(variable, entityName, model, userId)
        expression = expression.replace(variable, value ? `"${value}"` : '')
      }
    }
  }

  return parser.evaluate(expression)
}

/**
 * Parse entity variables
 * examples: this.name, user.id, this.entity.name
 */
async function getConfigVariableValue<T extends EntityModel> (variable: string, entityName: string, model: T, userId?: string) {
  const data = getVariableData(variable, entityName, model, userId)
  if (!data) {
    return
  }
  if (data.variableValue) {
    return parsePropertyValue(data.variableProperty as JSONSchema7Definition, data.variableValue)
  }
  if (!data.variableId) {
    return
  }
  const item = await Commun.getEntityDao(data.variableEntity).findOneById(data.variableId)
  if (item) {
    return item[data.variableKey as keyof EntityModel]
  }
}
