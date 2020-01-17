import React, { useState } from 'react'
import { ModelAttribute, NumberModelAttribute } from '@commun/core'
import { Grid, makeStyles, TextField } from '@material-ui/core'
import { TextDivider } from '../TextDivider'
import { handleNumberAttrChange } from '../../utils/attributes'

const useStyles = makeStyles(theme => ({
  hashAlgorithmSelectorFormControl: {
    width: '100%',
  },
}))

interface Props {
  attribute: NumberModelAttribute
  onChange: (key: keyof NumberModelAttribute, value: any) => void
}

export const NumberModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attribute, onChange } = props
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

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>
    </>
  )
}
