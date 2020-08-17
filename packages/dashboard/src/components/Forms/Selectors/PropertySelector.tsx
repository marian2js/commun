import React, { useEffect, useState } from 'react'
import { FormControl, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { EntityConfig, EntityModel } from '@commun/core'

const useStyles = makeStyles(theme => ({
  propertySelectorFormControl: {
    margin: theme.spacing(4, 1, 2),
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  label?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export const PropertySelector = (props: Props) => {
  const classes = useStyles()
  const { entity, label, value, onChange, className } = props
  const [properties, setProperties] = useState(entity.schema.properties || {})

  useEffect(() => setProperties(entity.schema.properties || {}), [entity])

  return (
    <FormControl className={className === undefined ? classes.propertySelectorFormControl : className}>
      <InputLabel id="entity-selector">
        {label || 'Property'}
      </InputLabel>
      <Select
        onChange={e => onChange ? onChange(e.target.value as string) : null}
        value={value || ''}
        labelId="property-selector"
        id="property-selector"
        fullWidth>
        {
          Object.keys(properties).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)
        }
      </Select>
    </FormControl>
  )
}
