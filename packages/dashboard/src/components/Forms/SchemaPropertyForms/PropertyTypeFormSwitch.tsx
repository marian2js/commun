import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import { ArraySchemaPropertyForm } from './ArraySchemaPropertyForm'
import { NumberModelAttributeForm } from './NumberModelAttributeForm'
import { EntityRefSchemaPropertyForm } from './EntityRefSchemaPropertyForm'
import { StringSchemaPropertyForm } from './StringSchemaPropertyForm'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { ObjectSchemaPropertyForm } from './ObjectSchemaPropertyForm'
import { EvalSchemaPropertyForm } from './EvalSchemaPropertyForm'
import { JSONSchema7 } from 'json-schema'
import { PropertyTypeName } from '../../../utils/properties'

interface Props {
  entity: EntityConfig<EntityModel>
  property?: JSONSchema7
  propertyType: PropertyTypeName
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const PropertyTypeFormSwitch = (props: Props) => {
  const { entity, subProperty, onChange } = props
  const [property, setProperty] = useState(props.property || {})
  const [propertyType, setPropertyType] = useState(props.propertyType)

  useEffect(() => {
    setProperty(props.property || {})
    setPropertyType(props.propertyType)
  }, [props.property, props.propertyType])

  if (Array.isArray(propertyType)) {
    // TODO
    return <></>
  }

  switch (propertyType) {
    case 'array':
      return <ArraySchemaPropertyForm entity={entity}
                                      property={property}
                                      subProperty={subProperty}
                                      onChange={onChange}/>
    case 'entity-ref':
      return <EntityRefSchemaPropertyForm entity={entity}
                                          property={property}
                                          subProperty={subProperty}
                                          onChange={onChange}/>

    case 'eval':
      return <EvalSchemaPropertyForm property={property}
                                     subProperty={subProperty}
                                     onChange={onChange}/>
    case 'number':
    case 'integer':
      return <NumberModelAttributeForm property={property}
                                       subProperty={subProperty}
                                       onChange={onChange}/>
    case 'object':
      return <ObjectSchemaPropertyForm entity={entity}
                                       property={property}
                                       subProperty={subProperty}
                                       onChange={onChange}/>

    case 'string':
      return <StringSchemaPropertyForm property={property}
                                       subProperty={subProperty}
                                       onChange={onChange}/>
  }

  return (
    <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}/>
  )
}
