import React from 'react'
import { FormControl, FormHelperText, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { PropertyTypeName } from '../../../utils/properties'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1, 0, 0),
    width: '100%',
  },
}))

interface Props {
  label?: string
  value: PropertyTypeName | ''
  onChange: (value: PropertyTypeName) => void
}

export const PropertyTypeSelector = (props: Props) => {
  const classes = useStyles()
  const { label, value, onChange } = props

  return (
    <FormControl className={classes.typeSelectorFormControl}>
      <InputLabel id="type-selector">
        {label || 'Type'}
      </InputLabel>
      <Select
        onChange={e => onChange(e.target.value as PropertyTypeName)}
        labelId="type-selector"
        id="type-selector"
        value={value || ''}
        required
        fullWidth>
        <MenuItem value="array">Array</MenuItem>
        <MenuItem value="boolean">Boolean</MenuItem>
        <MenuItem value="eval">Eval</MenuItem>
        <MenuItem value="object">Object</MenuItem>
        <MenuItem value="integer">Integer</MenuItem>
        <MenuItem value="number">Number</MenuItem>
        <MenuItem value="entity-ref">Entity Reference</MenuItem>
        <MenuItem value="string">String</MenuItem>
        <MenuItem value="user">User</MenuItem>
      </Select>
      <FormHelperText/>
    </FormControl>
  )
}
