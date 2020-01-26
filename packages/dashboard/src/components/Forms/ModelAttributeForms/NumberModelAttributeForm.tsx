import React, { useState } from 'react'
import { NumberModelAttribute } from '@commun/core'
import { Grid, TextField } from '@material-ui/core'
import { handleNumberAttrChange } from '../../../utils/attributes'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

interface Props {
  attribute: NumberModelAttribute
  subAttribute: boolean
  onChange: (key: keyof NumberModelAttribute, value: any) => void
}

export const NumberModelAttributeForm = (props: Props) => {
  const { attribute, subAttribute, onChange } = props
  const [min, setMin] = useState(attribute.min)
  const [max, setMax] = useState(attribute.max)

  return (
    <>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'min', e.target.value as string, setMin)}
          value={min}
          name="default"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Min"/>
      </Grid>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'max', e.target.value as string, setMax)}
          value={max}
          name="default"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Max"/>
      </Grid>

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
