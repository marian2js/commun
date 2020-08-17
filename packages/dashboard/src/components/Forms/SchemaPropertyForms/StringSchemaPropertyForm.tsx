import React, { useState } from 'react'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core'
import { TextDivider } from '../../TextDivider'
import { handleAttrChange, handleNumberAttrChange } from '../../../utils/properties'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'

const useStyles = makeStyles(theme => ({
  selectFormControl: {
    margin: theme.spacing(2, 0, 1),
    width: '100%',
  },
}))

interface Props {
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

const REGEX_OPTIONS = [{
  name: 'Letters',
  regex: '^[a-zA-Z]*$',
}, {
  name: 'Numbers',
  regex: '^[0-9]*$',
}, {
  name: 'Alphanumeric',
  regex: '^[a-zA-Z0-9]*$',
}]

export const StringSchemaPropertyForm = (props: Props) => {
  const classes = useStyles()
  const { property, subProperty, onChange } = props
  const [minLength, setMinLength] = useState(property.minLength)
  const [maxLength, setMaxLength] = useState(property.maxLength)
  const [format, setFormat] = useState<string | undefined>(property.format)
  const [pattern, setPattern] = useState<string | undefined>(property.pattern)
  const [patternSelector, setValidRegexSelector] = useState(
    REGEX_OPTIONS.find(o => o.regex === property.pattern)?.regex || (property.pattern ? 'custom' : 'all')
  )
  const [hashChecked, setHashChecked] = useState(property.format === 'hash')

  const handlePatternSelectorChange = (value: string) => {
    setValidRegexSelector(value)
    if (value !== 'custom') {
      handleAttrChange<JSONSchema7, string | undefined>(
        onChange,
        'pattern',
        value === 'all' ? undefined : value,
        setPattern
      )
    }
  }

  const handleHashSelectChange = () => {
    if (hashChecked) {
      setHashChecked(false)
      onChange('format', undefined)
    } else {
      setHashChecked(true)
      onChange('format', 'hash')
    }
  }

  return (
    <>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'minLength', e.target.value as string, setMinLength)}
          value={minLength}
          name="minLength"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Min Length"/>
      </Grid>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'maxLength', e.target.value as string, setMaxLength)}
          value={maxLength}
          name="maxLength"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Max Length"/>
      </Grid>

      <Grid item xs={12}>
        <FormControl className={classes.selectFormControl}>
          <InputLabel id="format-selector">
            Format
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'format', e.target.value as string, setFormat)}
            value={format}
            labelId="format-selector"
            id="format-selector"
            fullWidth>
            <MenuItem value="date-time">Date Time</MenuItem>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="hostname">Hostname</MenuItem>
            <MenuItem value="ipv4">IPv4</MenuItem>
            <MenuItem value="ipv6">IPv6</MenuItem>
            <MenuItem value="uri">URI</MenuItem>
          </Select>
          <FormHelperText>Which characters will be accepted on this attributes</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl className={classes.selectFormControl}>
          <InputLabel id="pattern-selector">
            Valid characters
          </InputLabel>
          <Select
            onChange={e => handlePatternSelectorChange(e.target.value as string)}
            value={patternSelector}
            labelId="pattern-selector"
            id="pattern-selector"
            fullWidth>
            <MenuItem value="all">All</MenuItem>
            {
              REGEX_OPTIONS.map(item => <MenuItem key={item.name} value={item.regex}>{item.name}</MenuItem>)
            }
            <MenuItem value="custom">Custom regular expression</MenuItem>
          </Select>
          <FormHelperText>Which characters will be accepted on this attributes</FormHelperText>
        </FormControl>
      </Grid>

      {
        patternSelector === 'custom' && (
          <Grid item xs={12}>
            <TextField
              onChange={e => handleAttrChange(onChange, 'pattern', e.target.value as string, setPattern)}
              value={pattern}
              name="pattern"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Custom Regex"/>
          </Grid>
        )
      }

      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}/>

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={hashChecked} onChange={handleHashSelectChange}/>}
              label="Hash value with bcrypt"/>
          </FormGroup>
        </FormControl>
      </Grid>
    </>
  )
}
