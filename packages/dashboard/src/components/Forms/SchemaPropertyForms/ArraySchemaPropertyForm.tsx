import React, { useState } from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  makeStyles,
  TextField
} from '@material-ui/core'
import { PropertyTypeSelector } from '../Selectors/PropertyTypeSelector'
import { ExpansionMenu } from '../../ExpansionMenu'
import { PropertyTypeFormSwitch } from './PropertyTypeFormSwitch'
import capitalize from '@material-ui/core/utils/capitalize'
import { SchemaPropertySharedOptions } from './SchemaPropertySharedOptions'
import { JSONSchema7 } from 'json-schema'
import {
  getPropertyTypeName,
  handleAttrChange,
  handleNumberAttrChange,
  PropertyTypeName
} from '../../../utils/properties'
import { TextDivider } from '../../TextDivider'

const useStyles = makeStyles(theme => ({
  typeSelector: {
    marginTop: theme.spacing(1),
  },
  listItemOptions: {
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  property: JSONSchema7
  subProperty: boolean
  onChange: (key: string, value: any) => void
}

export const ArraySchemaPropertyForm = (props: Props) => {
  const classes = useStyles()
  const { entity, property, subProperty, onChange } = props
  const [items, setItems] = useState(
    typeof property?.items !== 'boolean' && !Array.isArray(property.items) ? property.items : undefined
  )
  const [minItems, setMinItems] = useState(property.minItems)
  const [maxItems, setMaxItems] = useState(property.maxItems)
  const [uniqueItems, setUniqueItems] = useState(property.uniqueItems)

  const handleItemsTypeChange = (type: PropertyTypeName) => {
    handleArrayItemsChange('type', type)
  }

  const handleArrayItemsChange = (key: string, value: any) => {
    const newItems = {
      ...items,
      [key]: value
    }
    setItems(newItems)
    onChange('items', newItems)
  }

  return (
    <>
      <Grid item xs={12} className={classes.typeSelector}>
        <PropertyTypeSelector label="Array items type" value={items && getPropertyTypeName(items)}
                              onChange={handleItemsTypeChange}/>
      </Grid>

      {
        items?.type ?
          <ExpansionMenu className={classes.listItemOptions} items={[{
            key: 'array-items',
            label: `${capitalize(items.type.toString())} array item options`,
            component: (
              <Grid item xs={12}>
                <PropertyTypeFormSwitch entity={entity}
                                        property={items}
                                        propertyType={getPropertyTypeName(items)}
                                        onChange={handleArrayItemsChange}
                                        subProperty={true}/>
              </Grid>
            ),
            expanded: true,
          }]}/> : ''
      }

      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'minItems', e.target.value as string, setMinItems)}
          value={minItems}
          name="minItems"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Minimum number of items"/>
      </Grid>
      <Grid item xs={6}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'maxItems', e.target.value as string, setMaxItems)}
          value={maxItems}
          name="maxItems"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Maximum number of items"/>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={uniqueItems}
                                 onChange={() => handleAttrChange(onChange, 'uniqueItems', !uniqueItems, setUniqueItems)}/>}
              label="Unique Items"/>
            <FormHelperText>If checked, all the items in the array must be unique.</FormHelperText>
          </FormGroup>
        </FormControl>
      </Grid>

      <TextDivider><span/></TextDivider>

      <SchemaPropertySharedOptions property={property} subProperty={subProperty} onChange={onChange}
                                   noDefault={true}/>
    </>
  )
}
