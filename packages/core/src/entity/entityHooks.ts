import {
  EntityHook,
  EntityLifecycle,
  EntityModel,
  IncrementEntityHook,
  RefModelAttribute,
  SetEntityHook
} from '../types'
import { Commun } from '../Commun'
import { assertNever } from '../utils'
import { parseModelAttribute } from './attributes'
import { ServerError } from '../errors'

export const entityHooks = {
  async run<T extends EntityModel> (entityName: string, lifecycle: EntityLifecycle, model: T) {
    const config = Commun.getEntityConfig(entityName)
    const lifecycleHooks = config[lifecycle]
    if (!lifecycleHooks) {
      return
    }
    for (const hook of lifecycleHooks) {
      await runEntityHook(entityName, hook, model)
    }
  }
}

async function runEntityHook<T extends EntityModel> (entityName: string, hook: EntityHook, model: T) {
  switch (hook.action) {
    case 'increment':
      return runIncrementEntityHook(entityName, hook, model)
    case 'set':
      return runSetEntityHook(entityName, hook, model)
    default:
      assertNever(hook)
  }
}

async function runIncrementEntityHook<T extends EntityModel> (entityName: string, hook: IncrementEntityHook, model: T) {
  const targetData = getTargetData(hook.target, entityName, model)
  let incrementValue: number
  if (typeof hook.value === 'number') {
    incrementValue = hook.value
  } else {
    incrementValue = parseModelAttribute(targetData.targetAttribute, await parseHookString(hook.value, entityName, model)) as number
  }
  await Commun.getEntityDao(targetData.targetEntity)
    .incrementOne(targetData.targetId, { [targetData.targetKey]: incrementValue })
}

async function runSetEntityHook<T extends EntityModel> (entityName: string, hook: SetEntityHook, model: T) {
  const targetData = getTargetData(hook.target, entityName, model)
  let setValue
  if (typeof hook.value === 'string') {
    setValue = parseModelAttribute(targetData.targetAttribute, await parseHookString(hook.value, entityName, model))
  } else {
    setValue = hook.value
  }
  await Commun.getEntityDao(targetData.targetEntity)
    .updateOne(targetData.targetId, { [targetData.targetKey]: setValue })
}

function getTargetData<T extends EntityModel> (target: string, entityName: string, model: T) {
  const targetParts = target.split('.')
  if (targetParts[0] !== 'this') {
    throw new ServerError(`Invalid target ${target} on ${entityName} config`)
  }
  const config = Commun.getEntityConfig(entityName)
  const attributeEntries = Object.entries(config.attributes).find((([key, _]) => key === targetParts[1]))
  if (!attributeEntries || !attributeEntries[1]) {
    throw new ServerError(`Invalid target ${target} on ${entityName} config`)
  }
  const targetAttribute = attributeEntries[1]
  let targetEntity
  let targetId
  let targetKey
  let sameModel

  if (targetParts.length === 3 && ['user', 'ref'].includes(targetAttribute.type)) {
    targetEntity = (targetAttribute as RefModelAttribute).entity
    targetId = '' + model[targetParts[1] as keyof T]
    targetKey = targetParts[2]
    sameModel = false
  } else {
    targetEntity = entityName
    targetId = model._id!
    targetKey = targetParts[1]
    sameModel = true
  }

  return {
    targetAttribute,
    targetEntity,
    targetId,
    targetKey,
    sameModel,
  }
}

async function getVariableValue<T extends EntityModel> (variable: string, entityName: string, model: T) {
  const targetData = getTargetData(variable, entityName, model)
  if (targetData.sameModel) {
    return model[targetData.targetKey as keyof T]
  }
  const item = await Commun.getEntityDao(targetData.targetEntity).findOneById(targetData.targetId)
  if (item) {
    return item[targetData.targetKey as keyof EntityModel]
  }
}

async function parseHookString<T extends EntityModel> (str: string, entityName: string, model: T) {
  const variables = str.match(/{([^}]+)}/g)
  if (!variables) {
    return str
  }
  for (const variable of variables) {
    const value = await getVariableValue(variable.slice(1, -1).trim(), entityName, model)
    str = str.replace(variable, value ? '' + value : '')
  }
  return str
}
