import React, { useState } from 'react'
import { Grid } from '@material-ui/core'
import { getPropertyEntityRef } from '../../../utils/properties'
import { EntitySelector } from '../Selectors/EntitySelector'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'
import { EntityConfig, EntityModel } from '@commun/core'

interface Props {
  entity: EntityConfig<EntityModel>
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const EntityRefSchemaPropertyForm = (props: Props) => {
  const { property, subProperty, onChange } = props
  const [entityRef, setEntityRef] = useState(getPropertyEntityRef(property) || undefined)

  const handleEntityRefChange = (value: string) => {
    onChange('$ref', '#entity/' + value)
    setEntityRef(value)
  }

  return (
    <>
      <Grid item xs={12}>
        <EntitySelector useSingularNames={true} value={entityRef} onChange={handleEntityRefChange}/>
      </Grid>

      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange} noDefault={true}/>
    </>
  )
}
