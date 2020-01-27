import React, { useState } from 'react'
import { EntityConfig, EntityModel, MapModelAttribute, ModelAttribute } from '@commun/core'
import { Grid, makeStyles } from '@material-ui/core'
import { AttributeTypeSelector } from '../Selectors/AttributeTypeSelector'
import { ExpansionMenu } from '../../ExpansionMenu'
import { ModelAttributeFormSwitch } from './ModelAttributeFormSwitch'
import capitalize from '@material-ui/core/utils/capitalize'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

const useStyles = makeStyles(theme => ({
  typeSelector: {
    marginTop: theme.spacing(1),
  },
  mapKeyValueContainer: {
    marginBottom: theme.spacing(2),
    width: '100%',
  },
  mapKeyValueOptions: {
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  attribute: MapModelAttribute
  subAttribute: boolean
  onChange: (key: keyof MapModelAttribute, value: any) => void
}

export const MapModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { entity, attribute, subAttribute, onChange } = props
  const [keyType, setKeyType] = useState(attribute?.keyType || '')
  const [valueType, setValueType] = useState(attribute?.valueType || '')

  const handleKeyType = (type: ModelAttribute['type']) => {
    handleKeyOptionsChange('type', type)
  }

  const handleValueType = (type: ModelAttribute['type']) => {
    handleValueOptionsChange('type', type)
  }

  const handleKeyOptionsChange = <T extends ModelAttribute> (key: keyof T, value: any) => {
    const newKeyType = {
      ...keyType,
      [key]: value
    }
    setKeyType(newKeyType)
    onChange('keyType', newKeyType)
  }

  const handleValueOptionsChange = <T extends ModelAttribute> (key: keyof T, value: any) => {
    const newValueType = {
      ...valueType,
      [key]: value
    }
    setValueType(newValueType)
    onChange('valueType', newValueType)
  }

  return (
    <>
      <Grid item xs={12} className={classes.typeSelector}>
        <AttributeTypeSelector label="Key Type" value={keyType.type} onChange={handleKeyType}/>
      </Grid>

      <Grid item xs={12} className={classes.typeSelector}>
        <AttributeTypeSelector label="Value Type" value={valueType.type} onChange={handleValueType}/>
      </Grid>

      <div className={classes.mapKeyValueContainer}>
        {
          keyType.type ?
            <ExpansionMenu className={classes.mapKeyValueOptions} items={[{
              key: 'key-item',
              label: `${capitalize(keyType.type)} key options`,
              component: (
                <Grid item xs={12}>
                  <ModelAttributeFormSwitch entity={entity}
                                            attribute={keyType}
                                            onChange={handleKeyOptionsChange}
                                            subAttribute={true}/>
                </Grid>
              ),
              expanded: true,
            }]}/> : ''
        }

        {
          valueType.type ?
            <ExpansionMenu className={classes.mapKeyValueOptions} items={[{
              key: 'value-item',
              label: `${capitalize(valueType.type)} value options`,
              component: (
                <Grid item xs={12}>
                  <ModelAttributeFormSwitch entity={entity}
                                            attribute={valueType}
                                            onChange={handleValueOptionsChange}
                                            subAttribute={true}/>
                </Grid>
              ),
              expanded: true,
            }]}/> : ''
        }
      </div>

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}
                                   noDefault={true}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
