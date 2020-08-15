import { ObjectId } from 'mongodb'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import Ajv, { Options as AjvOptions } from 'ajv'
import { parseConfigString } from './configVariables'
import { BadRequestError, ServerError } from '../errors'
import { Commun } from '../Commun'

type ModelData<T> = { [P in keyof T]?: T[P] }

interface GetModelPropertyValueOptions<T> {
  entityName?: string
  property: JSONSchema7,
  data: ModelData<T>
  key: keyof T,
  authUserId?: string
  ignoreDefault?: boolean
}

export function getModelPropertyValue<T> (options: GetModelPropertyValueOptions<T>): any {
  const { property, data, key, authUserId, ignoreDefault } = options
  const defaultValue = ignoreDefault ? undefined : property.default

  if (property.$ref === '#user') {
    const userId = authUserId || defaultValue
    return userId ? new ObjectId(userId.toString()) : undefined
  }
  if (property.format === 'eval') {
    return formatEvalProperty(options, defaultValue)
  }
  if (property.format === 'id') {
    const id = data[key] || defaultValue
    return id ? new ObjectId(id as string) : undefined
  }

  return parsePropertyValue(property, data[key])
}

async function formatEvalProperty<T> (options: GetModelPropertyValueOptions<T>, defaultValue: any) {
  if (typeof options.property.pattern !== 'string') {
    return ''
  }
  let parsedValue
  try {
    parsedValue =
      await parseConfigString(options.property.pattern, options.entityName || '', options.data, options.authUserId)
  } catch (e) {
    console.error(`Evaluation failed for property ${options.key}`, e)
    throw new ServerError()
  }

  if (!parsedValue) {
    if (options.property.required && defaultValue === undefined) {
      throw new BadRequestError(`${options.key} is required`)
    }
    return defaultValue
  }
  return parsedValue
}

export function parsePropertyValue (property: JSONSchema7Definition, value: any) {
  if (typeof property === 'boolean') {
    return value === true || value === 'true'
  }
  if (isEntityRef(property) || property.format === 'id') {
    return new ObjectId(value)
  }
  switch (property.type) {
    case 'array':
      if (property.items && !Array.isArray(property.items)) {
        return value.map((valueItem: any) => parsePropertyValue(property.items as JSONSchema7Definition, valueItem))
      }
      return value
    case 'boolean':
      return value === true || value === 'true'
    case 'integer':
    case 'number':
      return Number(value)
    case 'null':
      return null
    case 'object':
      if (!property.properties) {
        return value
      }
      return Object.entries(property.properties)
        .reduce((prev: { [key: string]: any }, [key, objectProperty]) => {
          prev[key] = parsePropertyValue(objectProperty, value[key])
          return prev
        }, {})
    case 'string':
      return '' + value
    default:
      return value
  }
}

export function getSchemaValidator (options: AjvOptions) {
  return new Ajv({
    coerceTypes: true,
    unknownFormats: ['id', 'eval'],
    format: 'fast',
    ...options,
  })
}

export function isEntityRef (property: JSONSchema7Definition) {
  if (typeof property === 'boolean') {
    return false
  }
  return property.$ref?.startsWith('#entity/') || property.$ref === '#user'
}

export function getEntityRef (property: JSONSchema7Definition) {
  if (!isEntityRef(property) || typeof property === 'boolean') {
    return null
  }
  return property.$ref?.startsWith('#entity/') ?
    Commun.getPluralEntityName(property.$ref?.substr('#entity/'.length)) : 'users'
}

export function getSchemaDefinitions (): JSONSchema7['definitions'] {
  const definitions: JSONSchema7['definitions'] = {
    authUser: {
      $id: '#user',
      type: 'string',
      format: 'id',
    }
  }
  for (const entity of Object.values(Commun.getEntities())) {
    definitions[entity.config.entitySingularName!] = {
      $id: `#entity/${entity.config.entitySingularName!}`,
      type: 'string',
      format: 'id',
    }
  }
  return definitions
}
