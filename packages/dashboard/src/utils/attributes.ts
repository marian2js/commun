import React from 'react'
import { StringModelAttribute } from '@commun/core'

export type HandleAttrChangeKey = keyof StringModelAttribute

export function handleAttrChange<T> (
  onChange: (key: keyof StringModelAttribute, value: T) => void,
  key: HandleAttrChangeKey,
  value: T,
  setter: React.Dispatch<React.SetStateAction<T>>
) {
  setter(value)
  onChange(key, value)
}

export function handleNumberAttrChange (
  onChange: (key: keyof StringModelAttribute, value: (number | undefined)) => void,
  key: keyof StringModelAttribute,
  value: string,
  setter: React.Dispatch<React.SetStateAction<number | undefined>>
) {
  handleAttrChange<number | undefined>(onChange, key, value ? Number(value) : undefined, setter)
}
