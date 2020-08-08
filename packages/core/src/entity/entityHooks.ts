import { Request } from 'express'
import {
  EntityHook,
  EntityHookCondition,
  EntityModel,
  IncrementEntityHook,
  LifecycleEntityHooks,
  SetEntityHook
} from '../types'
import { Commun } from '../Commun'
import { assertNever } from '../utils'
import { parseModelAttribute } from './modelAttributes'
import { getVariableData, parseConfigString } from './configVariables'

export const entityHooks = {
  async run<T extends EntityModel> (entityName: string, lifecycle: keyof LifecycleEntityHooks, model: T, req: Request) {
    const { config, codeHooks } = Commun.getEntity(entityName)

    // Run hooks from config
    const lifecycleHooks = config.hooks && config.hooks[lifecycle] || []
    for (const hook of lifecycleHooks) {
      await runEntityHook(entityName, hook, model, req.auth?.id)
    }

    // Run code hooks
    const codeHook = codeHooks?.[lifecycle]
    if (codeHook) {
      await codeHook(model, req)
    }
  }
}

async function runEntityHook<T extends EntityModel> (entityName: string, hook: EntityHook, model: T, userId?: string) {
  if (hook.condition && !(await validHookCondition(entityName, hook.condition, model, userId))) {
    return
  }

  switch (hook.action) {
    case 'increment':
      return runIncrementEntityHook(entityName, hook, model, userId)
    case 'set':
      return runSetEntityHook(entityName, hook, model, userId)
    default:
      assertNever(hook)
  }
}

async function validHookCondition<T extends EntityModel> (entityName: string, condition: EntityHookCondition, model: T, userId?: string) {
  const leftValue = typeof condition.left === 'string' ?
    await parseConfigString(condition.left, entityName, model, userId) : condition.left
  const rightValue = typeof condition.right === 'string' ?
    await parseConfigString(condition.right, entityName, model, userId) : condition.right

  switch (condition.comparator) {
    case '=':
      return leftValue === rightValue
    case '>':
      return leftValue > rightValue
    case '<':
      return leftValue < rightValue
    case '>=':
      return leftValue >= rightValue
    case '<=':
      return leftValue <= rightValue
    case '!=':
      return leftValue !== rightValue
    default:
      assertNever(condition.comparator)
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
