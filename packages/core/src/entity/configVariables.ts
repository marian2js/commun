import { Commun } from '../Commun'
import { ServerError } from '../errors'
import { EntityModel, ModelAttribute, RefModelAttribute } from '../types'
import { parseModelAttribute } from './modelAttributes'
import * as mathjs from 'mathjs'

export async function parseConfigString<T extends EntityModel> (str: string, entityName: string, model: T, userId?: string) {
  const expressions = str.match(/{([^}]+)}/g)
  if (!expressions) {
    return str
  }
  if (expressions.length === 1 && /^{.*}$/.test(str.trim())) {
    return await getConfigExpressionValue(expressions[0].trim().slice(1, -1).trim(), entityName, model, userId)
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
      variableAttribute: Commun.getEntityConfig('users').attributes[variableParts[1] as keyof EntityModel] as ModelAttribute,
    }
  }
  if (variableParts[0] !== 'this') {
    throw new ServerError(`Invalid variable ${variable} on ${entityName} config`)
  }
  const config = Commun.getEntityConfig(entityName)
  const attributeEntries = Object.entries(config.attributes).find((([key, _]) => key === variableParts[1]))
  if (!attributeEntries || !attributeEntries[1]) {
    throw new ServerError(`Invalid variable ${variable} on ${entityName} config`)
  }
  let variableEntity
  let variableId
  let variableKey
  let variableAttribute
  let variableValue

  if (variableParts.length === 3 && ['user', 'ref'].includes(attributeEntries[1].type)) {
    const id = model[variableParts[1] as keyof T]
    variableId = id ? '' + id : undefined
    variableEntity = attributeEntries[1].type === 'user' ? 'users' : (attributeEntries[1] as RefModelAttribute).entity
    variableKey = variableParts[2]
    variableAttribute = Commun.getEntityConfig(variableEntity).attributes[variableKey as keyof EntityModel] as ModelAttribute
  } else {
    variableEntity = entityName
    variableId = model.id!
    variableKey = variableParts[1]
    variableAttribute = attributeEntries[1]
    variableValue = model[variableKey as keyof T]
  }

  return {
    variableAttribute,
    variableEntity,
    variableId,
    variableKey,
    variableValue,
  }
}

async function getConfigExpressionValue<T extends EntityModel> (expression: string, entityName: string, model: T, userId?: string) {
  const variables = expression.match(/([a-zA-Z][\w.]+)/g)

  if (variables && variables[0] === expression) {
    return await getConfigVariableValue(expression, entityName, model, userId)
  }

  if (variables) {
    for (const variable of variables) {
      const value = await getConfigVariableValue(variable, entityName, model, userId)
      expression = expression.replace(variable, value ? '' + value : '')
    }
  }

  return mathjs.evaluate(expression)
}

async function getConfigVariableValue<T extends EntityModel> (variable: string, entityName: string, model: T, userId?: string) {
  const data = getVariableData(variable, entityName, model, userId)
  if (!data) {
    return
  }
  if (data.variableValue) {
    return parseModelAttribute(data.variableAttribute, data.variableValue)
  }
  if (!data.variableId) {
    return
  }
  const item = await Commun.getEntityDao(data.variableEntity).findOneById(data.variableId)
  if (item) {
    return item[data.variableKey as keyof EntityModel]
  }
}
