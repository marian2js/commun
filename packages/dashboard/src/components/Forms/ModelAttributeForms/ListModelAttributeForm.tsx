import React, { useState } from 'react'
import { EntityConfig, EntityModel, ListModelAttribute, ModelAttribute } from '@commun/core'
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
  listItemOptions: {
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  attribute: ListModelAttribute
  subAttribute: boolean
  onChange: (key: keyof ListModelAttribute, value: any) => void
}

export const ListModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { entity, attribute, subAttribute, onChange } = props
  const [listType, setListType] = useState(attribute?.listType || '')

  const handleListType = (type: ModelAttribute['type']) => {
    handleListItemOptionsChange('type', type)
  }

  const handleListItemOptionsChange = <T extends ModelAttribute> (key: keyof T, value: any) => {
    const newListType = {
      ...listType,
      [key]: value
    }
    setListType(newListType)
    onChange('listType', newListType)
  }

  return (
    <>
      <Grid item xs={12} className={classes.typeSelector}>
        <AttributeTypeSelector label="List Type" value={listType.type} onChange={handleListType}/>
      </Grid>

      {
        listType.type ?
          <ExpansionMenu className={classes.listItemOptions} items={[{
            key: 'list-item',
            label: `${capitalize(listType.type)} list item options`,
            component: (
              <Grid item xs={12}>
                <ModelAttributeFormSwitch entity={entity}
                                          attribute={listType}
                                          onChange={handleListItemOptionsChange}
                                          subAttribute={true}/>
              </Grid>
            ),
            expanded: true,
          }]}/> : ''
      }

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}
                                   noDefault={true}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
