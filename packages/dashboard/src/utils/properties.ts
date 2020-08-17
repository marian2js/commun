import React from 'react'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export type PropertyTypeName = JSONSchema7['type'] | 'entity-ref' | 'eval'

export function getPropertyTypeName (property: JSONSchema7): PropertyTypeName {
  if (propertyIsEntityRef(property)) {
    return 'entity-ref'
  }
  if (property.format?.startsWith('eval:')) {
    return 'eval'
  }
  return property.type
}

export function propertyIsEntityRef (property: JSONSchema7Definition) {
  if (typeof property === 'boolean') {
    return false
  }
  return property.$ref?.startsWith('#entity/') || property.$ref === '#user'
}

export function getPropertyEntityRef (property: JSONSchema7Definition) {
  if (!propertyIsEntityRef(property) || typeof property === 'boolean') {
    return
  }
  return property.$ref?.startsWith('#entity/') ? property.$ref?.substr('#entity/'.length) : 'user'
}

export function handleAttrChange<M, T> (
  onChange: (key: keyof M, value: T) => void,
  key: keyof M,
  value: T,
  setter: React.Dispatch<React.SetStateAction<T>> | React.Dispatch<React.SetStateAction<T | undefined>>
) {
  setter(value)
  onChange(key, value)
}

export function handleNumberAttrChange<M> (
  onChange: (key: keyof M, value: (number | undefined)) => void,
  key: keyof M,
  value: string,
  setter: React.Dispatch<React.SetStateAction<number | undefined>>
) {
  handleAttrChange<M, number | undefined>(onChange, key, value ? Number(value) : undefined, setter)
}
