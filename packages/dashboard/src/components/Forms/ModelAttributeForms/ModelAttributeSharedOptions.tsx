import React, { useState } from 'react'
import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid, TextField } from '@material-ui/core'
import { handleAttrChange } from '../../../utils/attributes'
import { ModelAttribute } from '@commun/core'

interface Props {
  attribute?: ModelAttribute
  subAttribute: boolean
  onChange: (key: any, value: any) => void
  noDefault?: boolean
}

export const ModelAttributeSharedOptions = (props: Props) => {
  const { attribute, subAttribute, onChange, noDefault } = props
  const [required, setRequired] = useState(attribute?.required)
  const [unique, setUnique] = useState(attribute?.unique)
  const [attributeDefault, setAttributeDefault] = useState(attribute?.default || '')

  return (
    <>
      {
        noDefault ? '' :
          <Grid item xs={12}>
            <TextField
              onChange={e => handleAttrChange(onChange, 'default', e.target.value, setAttributeDefault)}
              value={attributeDefault}
              name="default"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Default"/>
          </Grid>
      }

      {
        subAttribute ? '' :
          <>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox checked={required}
                                onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(
                                  onChange, 'required', !required, setRequired)
                                }/>
                    }
                    label="Required"/>
                </FormGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox checked={unique}
                                onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(
                                  onChange, 'unique', !unique, setUnique)}/>
                    }
                    label="Unique"/>
                </FormGroup>
              </FormControl>
            </Grid>
          </>
      }
    </>
  )
}
