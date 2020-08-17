import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid, TextField } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import { getPropertyTypeName, PropertyTypeName } from '../../../utils/properties'
import { PropertyTypeSelector } from '../Selectors/PropertyTypeSelector'
import { PropertyTypeFormSwitch } from './PropertyTypeFormSwitch'
import { JSONSchema7 } from 'json-schema'

interface Props {
  entity: EntityConfig<EntityModel>
  property?: JSONSchema7
  propertyKey?: string
  newProperty: boolean
  onChange: (key: string, value: any) => void
  onKeyChange: (key: string) => void
  onRequiredChange: (value: boolean) => void
}

export const SchemaPropertyForm = (props: Props) => {
  const { entity, property, onChange, onKeyChange, onRequiredChange, } = props
  const [type, setType] = useState(property ? getPropertyTypeName(property) : undefined)
  const [propertyData, setPropertyData] = useState<JSONSchema7 | undefined>(property ? { ...property } : undefined)
  const [propertyKey, setPropertyKey] = useState(props.propertyKey || '')
  const [newProperty, setNewProperty] = useState(props.newProperty)
  const [required, setRequired] = useState(propertyKey ? entity.schema.required?.includes(propertyKey) : false)

  useEffect(() => {
    setRequired(propertyKey ? entity.schema.required?.includes(propertyKey) : false)
    setNewProperty(props.newProperty)
  }, [props.newProperty, propertyKey, entity.schema.required])

  const handleNewPropertyKeyChange = (key: string) => {
    setPropertyKey(key)
    onKeyChange(key)
  }

  const handleTypeChange = (typeName: PropertyTypeName) => {
    switch (typeName) {
      case 'entity-ref':
      case 'eval':
        break
      default:
        setPropertyData({
          ...(propertyData || {}),
          type: typeName,
        })
        onChange('type', typeName)
    }
    setType(typeName)
  }

  const handleRequiredChange = () => {
    onRequiredChange(!required)
    setRequired(!required)
  }

  return (
    <Grid container>
      {
        newProperty ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleNewPropertyKeyChange(e.target.value as string)}
              value={propertyKey}
              name="propertyKey"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              label="Property Key"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <PropertyTypeSelector value={type} onChange={handleTypeChange}/>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={required} onChange={handleRequiredChange}/>}
              label="Required"/>
          </FormGroup>
        </FormControl>
      </Grid>
      {
        type && (
          <PropertyTypeFormSwitch entity={entity}
                                  property={propertyData}
                                  propertyType={type}
                                  onChange={onChange}
                                  subProperty={false}/>
        )
      }
    </Grid>
  )
}
