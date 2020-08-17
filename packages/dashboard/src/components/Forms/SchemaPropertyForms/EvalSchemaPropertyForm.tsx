import React, { useState } from 'react'
import { Grid, TextField } from '@material-ui/core'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'

interface Props {
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const EvalSchemaPropertyForm = (props: Props) => {
  const { property, subProperty, onChange } = props
  const [evalValue, setEval] = useState(property.format?.substr('eval:'.length))

  const handleEvalChange = (value: string) => {
    setEval(value)
    onChange('format', 'eval:' + value)
  }

  return (
    <>
      <Grid item xs={12}>
        <TextField
          onChange={e => handleEvalChange(e.target.value)}
          value={evalValue}
          name="eval"
          type="string"
          variant="outlined"
          margin="normal"
          fullWidth
          required
          label="Eval"
          helperText={
            <span>
              Supports constants or expressions like <i>{'{this.value + 3}'}</i>, <i>{'{slug(this.name)}'}</i>, <i>{'{randomChars(5)}'}</i>
            </span>
          }/>
      </Grid>

      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}/>
    </>
  )
}
