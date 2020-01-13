import { EntityHook, EntityLifecycle, EntityModel, IncrementEntityHook, SetEntityHook } from '../types'
import { Commun } from '../Commun'
import { assertNever } from '../utils'
import { parseModelAttribute } from './modelAttributes'
import { getVariableData, parseConfigString } from './configVariables'

export const entityHooks = {
  async run<T extends EntityModel> (entityName: string, lifecycle: EntityLifecycle, model: T, userId?: string) {
    const config = Commun.getEntityConfig(entityName)
    const lifecycleHooks = config[lifecycle]
    if (!lifecycleHooks) {
      return
    }
    for (const hook of lifecycleHooks) {
      await runEntityHook(entityName, hook, model, userId)
    }
  }
}

async function runEntityHook<T extends EntityModel> (entityName: string, hook: EntityHook, model: T, userId?: string) {
  switch (hook.action) {
    case 'increment':
      return runIncrementEntityHook(entityName, hook, model, userId)
    case 'set':
      return runSetEntityHook(entityName, hook, model, userId)
    default:
      assertNever(hook)
  }
}

async function runIncrementEntityHook<T extends EntityModel> (entityName: string, hook: IncrementEntityHook, model: T, userId?: string) {
  const targetData = getVariableData(hook.target, entityName, model, userId)
  if (!targetData) {
    return
  }
  let incrementValue: number
  if (typeof hook.value === 'number') {
    incrementValue = hook.value
  } else {
    const parsedStr = await parseConfigString(hook.value, entityName, model, userId)
    incrementValue = parseModelAttribute(targetData.variableAttribute, parsedStr) as number
  }
  if (!targetData.variableId) {
    return
  }
  await Commun.getEntityDao(targetData.variableEntity)
    .incrementOne(targetData.variableId, { [targetData.variableKey]: incrementValue })
}

async function runSetEntityHook<T extends EntityModel> (entityName: string, hook: SetEntityHook, model: T, userId?: string) {
  const targetData = getVariableData(hook.target, entityName, model, userId)
  if (!targetData) {
    return
  }
  let setValue
  if (typeof hook.value === 'string') {
    const parsedStr = await parseConfigString(hook.value, entityName, model, userId)
    setValue = parseModelAttribute(targetData.variableAttribute, parsedStr)
  } else {
    setValue = hook.value
  }
  if (!targetData.variableId) {
    return
  }
  await Commun.getEntityDao(targetData.variableEntity)
    .updateOne(targetData.variableId, { [targetData.variableKey]: setValue })
}
