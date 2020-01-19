import React, { useEffect, useState } from 'react'
import { FormControl, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { EntityConfig, EntityModel } from '@commun/core'

const useStyles = makeStyles(theme => ({
  attributeSelectorFormControl: {
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

export const AttributeSelector = (props: Props) => {
  const classes = useStyles()
  const { entity, label, value, onChange, className } = props
  const [attributes, setAttributes] = useState(entity.attributes)

  useEffect(() => setAttributes(entity.attributes), [entity])

  return (
    <FormControl className={className === undefined ? classes.attributeSelectorFormControl : className}>
      <InputLabel id="entity-selector">
        {label || 'Attribute'}
      </InputLabel>
      <Select
        onChange={e => onChange ? onChange(e.target.value as string) : null}
        value={value || ''}
        labelId="attribute-selector"
        id="attribute-selector"
        fullWidth>
        {
          Object.keys(attributes).map((key) => <MenuItem key={key} value={key}>{key}</MenuItem>)
        }
      </Select>
    </FormControl>
  )
}
