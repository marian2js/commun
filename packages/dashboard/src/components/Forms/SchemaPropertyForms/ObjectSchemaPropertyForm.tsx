import React from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'

interface Props {
  entity: EntityConfig<EntityModel>
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const ObjectSchemaPropertyForm = (props: Props) => {
  const { property, subProperty, onChange } = props

  return (
    <>
      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}
                                   noDefault={true}/>
    </>
  )
}
