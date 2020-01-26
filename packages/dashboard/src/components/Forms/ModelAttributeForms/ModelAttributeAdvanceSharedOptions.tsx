import React, { useState } from 'react'
import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid } from '@material-ui/core'
import { handleAttrChange } from '../../../utils/attributes'
import { ModelAttribute } from '@commun/core'
import { TextDivider } from '../../TextDivider'

interface Props {
  attribute?: ModelAttribute
  subAttribute: boolean
  onChange: (key: any, value: any) => void
  noDivider?: boolean
}

export const ModelAttributeAdvanceSharedOptions = (props: Props) => {
  const { attribute, subAttribute, onChange, noDivider } = props
  const [index, setIndex] = useState(attribute?.index)
  const [readonly, setReadonly] = useState(attribute?.readonly)

  return (
    <>
      {
        noDivider ? '' :
          <Grid item xs={12}>
            <TextDivider><span>Advanced options</span></TextDivider>
          </Grid>
      }

      {
        subAttribute ? '' :
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox checked={index}
                              onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(
                                onChange, 'index', !index, setIndex)}/>
                  }
                  label="Index"/>
              </FormGroup>
            </FormControl>
          </Grid>
      }

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={readonly}
                          onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(
                            onChange, 'readonly', !readonly, setReadonly)}/>
              }
              label="Read only"/>
          </FormGroup>
        </FormControl>
      </Grid>
    </>
  )
}
