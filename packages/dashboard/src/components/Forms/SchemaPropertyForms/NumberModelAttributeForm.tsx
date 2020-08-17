import React, { useState } from 'react'
import { Grid, TextField } from '@material-ui/core'
import { handleNumberAttrChange } from '../../../utils/properties'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'

interface Props {
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const NumberModelAttributeForm = (props: Props) => {
  const { property, subProperty, onChange } = props
  const [minimum, setMinimum] = useState(property.minimum)
  const [maximum, setMaximum] = useState(property.maximum)
  const [exclusiveMinimum, setExclusiveMinimum] = useState(property.exclusiveMinimum)
  const [exclusiveMaximum, setExclusiveMaximum] = useState(property.exclusiveMaximum)
  const [multipleOf, setMultipleOf] = useState(property.multipleOf)

  return (
    <>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'minimum', e.target.value as string, setMinimum)}
          value={minimum}
          name="minimum"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Minimum"/>
      </Grid>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'maximum', e.target.value as string, setMaximum)}
          value={maximum}
          name="maximum"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Maximum"/>
      </Grid>

      <Grid item xs={4}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'exclusiveMinimum', e.target.value as string, setExclusiveMinimum)}
          value={exclusiveMinimum}
          name="exclusive-minimum"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Exclusive Minimum"/>
      </Grid>
      <Grid item xs={4}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'exclusiveMaximum', e.target.value as string, setExclusiveMaximum)}
          value={exclusiveMaximum}
          name="exclusive-maximum"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Exclusive Maximum"/>
      </Grid>

      <Grid item xs={4}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'multipleOf', e.target.value as string, setMultipleOf)}
          value={multipleOf}
          name="multipleOf"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Multiple Of"/>
      </Grid>

      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}/>
    </>
  )
}
