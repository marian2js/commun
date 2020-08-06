import React, { useState } from 'react'
import { EvalModelAttribute } from '@commun/core'
import { Grid, TextField } from '@material-ui/core'
import { handleAttrChange } from '../../../utils/attributes'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

interface Props {
  attribute: EvalModelAttribute
  subAttribute: boolean
  onChange: (key: keyof EvalModelAttribute, value: any) => void
}

export const EvalModelAttributeForm = (props: Props) => {
  const { attribute, subAttribute, onChange } = props
  const [evalValue, setEval] = useState(attribute.eval)

  return (
    <>
      <Grid item xs={12}>
        <TextField
          onChange={e => handleAttrChange(onChange, 'eval', e.target.value as string, setEval)}
          value={evalValue}
          name="eval"
          type="string"
          variant="outlined"
          margin="normal"
          fullWidth
          required
          label="Eval"
          helperText="Supports constants or expressions like {this.value + 3}"/>
      </Grid>

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
