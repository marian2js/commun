import { Request } from 'express'
import {
  EntityHook,
  EntityHookCondition,
  EntityModel,
  HashEntityHook,
  IncrementEntityHook,
  LifecycleEntityHooks,
  SetEntityHook
} from '../types'
import { Commun } from '../Commun'
import { assertNever, SecurityUtils } from '../utils'
import { parsePropertyValue } from './entitySchema'
import { getVariableData, parseConfigString } from './configVariables'

export const entityHooks = {
  async run<T extends EntityModel> (entityName: string, lifecycle: keyof LifecycleEntityHooks, model: T, req: Request) {
    const { config, codeHooks } = Commun.getEntity(entityName)

    // Run hooks from config
    const lifecycleHooks = config.hooks && config.hooks[lifecycle] || []
    for (const hook of lifecycleHooks) {
      await runEntityHook(entityName, lifecycle, hook, model, req.auth?.id)
    }

    // Run code hooks
    const codeHook = codeHooks?.[lifecycle]
    if (codeHook) {
      await codeHook(model, req)
    }
  }
}

async function runEntityHook<T extends EntityModel> (
  entityName: string,
  lifecycle: keyof LifecycleEntityHooks,
  hook: EntityHook,
  model: T,
  userId?: string
) {
  if (hook.condition && !(await validHookCondition(entityName, hook.condition, model, userId))) {
    return
  }

  switch (hook.action) {
    case 'hash':
      return runHashEntityHook(entityName, lifecycle, hook, model, userId)
    case 'increment':
      return runIncrementEntityHook(entityName, lifecycle, hook, model, userId)
    case 'set':
      return runSetEntityHook(entityName, lifecycle, hook, model, userId)
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

async function runHashEntityHook<T extends EntityModel> (
  entityName: string,
  lifecycle: keyof LifecycleEntityHooks,
  hook: HashEntityHook,
  model: T,
  userId?: string
) {
  const targetData = getVariableData(hook.target, entityName, model, userId)
  if (typeof targetData?.variableValue === 'string' && targetData.variableId) {
    const hashed = await SecurityUtils.hashWithBcrypt(targetData.variableValue, hook.salt_rounds || 12)
    if (entityName === targetData.variableEntity && lifecycle.startsWith('before')) {
      model[targetData.variableKey as keyof T] = hashed as any
    } else {
      await Commun.getEntityDao(targetData.variableEntity)
        .updateOne(targetData.variableId, { [targetData.variableKey]: hashed })
    }
  }
}

async function runIncrementEntityHook<T extends EntityModel> (
  entityName: string,
  lifecycle: keyof LifecycleEntityHooks,
  hook: IncrementEntityHook,
  model: T,
  userId?: string
) {
  const targetData = getVariableData(hook.target, entityName, model, userId)
  if (!targetData) {
    return
  }
  let incrementValue: number | undefined
  if (typeof hook.value === 'number') {
    incrementValue = hook.value
  } else {
    if (targetData.variableProperty) {
      const parsedStr = await parseConfigString(hook.value, entityName, model, userId)
      incrementValue = parsePropertyValue(targetData.variableProperty, parsedStr) as number
    }
  }
  if (!targetData.variableId || !incrementValue) {
    return
  }

  if (entityName === targetData.variableEntity && lifecycle.startsWith('before')) {
    if (typeof model[targetData.variableKey as keyof T] === 'number') {
      ((model as unknown) as { [k: string]: number })[targetData.variableKey] += incrementValue
    }
  } else {
    await Commun.getEntityDao(targetData.variableEntity)
      .incrementOne(targetData.variableId, { [targetData.variableKey]: incrementValue })
  }
}

async function runSetEntityHook<T extends EntityModel> (
  entityName: string,
  lifecycle: keyof LifecycleEntityHooks,
  hook: SetEntityHook,
  model: T,
  userId?: string
) {
  const targetData = getVariableData(hook.target, entityName, model, userId)
  if (!targetData) {
    return
  }
  let setValue
  if (typeof hook.value === 'string') {
    if (targetData.variableProperty) {
      const parsedStr = await parseConfigString(hook.value, entityName, model, userId)
      setValue = parsePropertyValue(targetData.variableProperty, parsedStr)
    }
  } else {
    setValue = hook.value
  }
  if (!targetData.variableId || !setValue) {
    return
  }

  if (entityName === targetData.variableEntity && lifecycle.startsWith('before')) {
    model[targetData.variableKey as keyof T] = setValue
  } else {
    await Commun.getEntityDao(targetData.variableEntity)
      .updateOne(targetData.variableId, { [targetData.variableKey]: setValue })
  }
}
