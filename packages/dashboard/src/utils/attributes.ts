import React from 'react'
import { ModelAttribute } from '@commun/core'

export function handleAttrChange<M extends ModelAttribute, T> (
  onChange: (key: keyof M, value: T) => void,
  key: keyof M,
  value: T,
  setter: React.Dispatch<React.SetStateAction<T>>
) {
  setter(value)
  onChange(key, value)
}

export function handleNumberAttrChange<M extends ModelAttribute> (
  onChange: (key: keyof M, value: (number | undefined)) => void,
  key: keyof M,
  value: string,
  setter: React.Dispatch<React.SetStateAction<number | undefined>>
) {
  handleAttrChange<M, number | undefined>(onChange, key, value ? Number(value) : undefined, setter)
}
