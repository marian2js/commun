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
import { handleAttrChange, handleNumberAttrChange } from '../../../utils/properties'
import { JSONSchema7 } from 'json-schema'

const useStyles = makeStyles(theme => ({
  defaultSelectorFormControl: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
}))

interface Props {
  property?: JSONSchema7
  subProperty: boolean
  onChange: (key: any, value: any) => void
  noDefault?: boolean
}

export const SchemaPropertySharedOptions = (props: Props) => {
  const classes = useStyles()
  const { property, subProperty, onChange, noDefault } = props
  const [attributeDefault, setAttributeDefault] = useState<any>(property?.default ?? '')
  const [readOnly, setReadOnly] = useState(property?.readOnly || false)
  const [writeOnly, setWriteOnly] = useState(property?.writeOnly || false)

  const handleAttributeDefaultChange = (value: string) => {
    switch (property?.type) {
      case 'number':
      case 'integer':
        handleNumberAttrChange(onChange, 'default', value, setAttributeDefault)
        break
      case 'boolean':
        const defaultValue = value === 'true' ? true : value === 'false' ? false : undefined
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
        value={attributeDefault ?? ''}
        name="default"
        type={property?.type === 'number' || property?.type === 'integer' ? 'number' : 'text'}
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
          value={'' + attributeDefault}
          labelId="attribute-default-selector"
          id="attribute-default-selector"
          fullWidth>
          <MenuItem value="">No Default</MenuItem>
          <MenuItem value="true">True</MenuItem>
          <MenuItem value="false">False</MenuItem>
        </Select>
      </FormControl>
    )
  }

  return (
    <>
      {
        !noDefault && (property?.type === 'boolean' ? renderBooleanDefaultTextField() : renderAttributeDefaultTextField())
      }

      {
        subProperty ? '' :
          <>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox checked={readOnly}
                                onChange={() => handleAttrChange<JSONSchema7, boolean>(
                                  onChange, 'readOnly', !readOnly, setReadOnly)}/>
                    }
                    label="Read only"/>
                </FormGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox checked={writeOnly}
                                onChange={() => handleAttrChange<JSONSchema7, boolean>(
                                  onChange, 'writeOnly', !writeOnly, setWriteOnly)}/>
                    }
                    label="Write only"/>
                </FormGroup>
              </FormControl>
            </Grid>
          </>
      }
    </>
  )
}
