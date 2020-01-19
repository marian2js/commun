import React from 'react'

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
