import React from 'react'
import { FormControl, FormHelperText, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { ModelAttribute } from '@commun/core'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1, 0, 0),
    width: '100%',
  },
}))

interface Props {
  label?: string
  value: ModelAttribute['type'] | ''
  onChange: (value: ModelAttribute['type']) => void
}

export const AttributeTypeSelector = (props: Props) => {
  const classes = useStyles()
  const { label, value, onChange } = props

  return (
    <FormControl className={classes.typeSelectorFormControl}>
      <InputLabel id="type-selector">
        {label || 'Type'}
      </InputLabel>
      <Select
        onChange={e => onChange(e.target.value as ModelAttribute['type'])}
        labelId="type-selector"
        id="type-selector"
        value={value}
        required
        fullWidth>
        <MenuItem value="boolean">Boolean</MenuItem>
        <MenuItem value="date">Date</MenuItem>
        <MenuItem value="email">Email</MenuItem>
        <MenuItem value="enum">Enum</MenuItem>
        <MenuItem value="list">List</MenuItem>
        <MenuItem value="map">Map</MenuItem>
        <MenuItem value="number">Number</MenuItem>
        <MenuItem value="ref">Entity Reference</MenuItem>
        <MenuItem value="slug">Slug</MenuItem>
        <MenuItem value="string">String</MenuItem>
        <MenuItem value="user">User</MenuItem>
      </Select>
      <FormHelperText></FormHelperText>
    </FormControl>
  )
}
