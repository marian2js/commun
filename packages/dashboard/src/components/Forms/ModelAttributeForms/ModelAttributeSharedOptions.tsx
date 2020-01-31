import React, { useState } from 'react'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core'
import { handleAttrChange, handleNumberAttrChange } from '../../../utils/attributes'
import { ModelAttribute } from '@commun/core'

const useStyles = makeStyles(theme => ({
  defaultSelectorFormControl: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
}))

interface Props {
  attribute?: ModelAttribute
  subAttribute: boolean
  onChange: (key: any, value: any) => void
  noDefault?: boolean
}

export const ModelAttributeSharedOptions = (props: Props) => {
  const classes = useStyles()
  const { attribute, subAttribute, onChange, noDefault } = props
  const [required, setRequired] = useState(attribute?.required)
  const [unique, setUnique] = useState(attribute?.unique)
  const [attributeDefault, setAttributeDefault] = useState(attribute?.default || '')

  const handleAttributeDefaultChange = (value: string) => {
    switch (attribute?.type) {
      case 'number':
        handleNumberAttrChange(onChange, 'default', value, setAttributeDefault)
        break
      case 'boolean':
        const defaultValue = ['', undefined].includes(value) ? undefined : value === 'true'
        handleAttrChange(onChange, 'default', defaultValue, setAttributeDefault)
        break
      default:
        handleAttrChange(onChange, 'default', value, setAttributeDefault)
    }
  }

  const renderAttributeDefaultTextField = () => {
    return (
      <TextField
        onChange={e => handleAttributeDefaultChange(e.target.value)}
        value={attributeDefault || ''}
        name="default"
        type={attribute?.type === 'number' ? 'number' : 'text'}
        variant="outlined"
        margin="normal"
        fullWidth
        label="Default"/>
    )
  }

  const renderBooleanDefaultTextField = () => {
    return (
      <FormControl className={classes.defaultSelectorFormControl}>
        <InputLabel id="attribute-default-selector">
          Default
        </InputLabel>
        <Select
          onChange={e => handleAttributeDefaultChange(e.target.value as string)}
          value={(attributeDefault || '').toString()}
          labelId="attribute-default-selector"
          id="attribute-default-selector"
          fullWidth>
          <MenuItem value=""/>
          <MenuItem value="true">True</MenuItem>
          <MenuItem value="false">False</MenuItem>
        </Select>
      </FormControl>
    )
  }

  return (
    <>
      {
        !noDefault && (attribute?.type === 'boolean' ? renderBooleanDefaultTextField() : renderAttributeDefaultTextField())
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
