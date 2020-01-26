import { Grid, TextField } from '@material-ui/core'
import React, { useState } from 'react'
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import { handleAttrChange } from '../../../utils/attributes'
import { AttributeTypeSelector } from '../Selectors/AttributeTypeSelector'
import { ModelAttributeFormSwitch } from './ModelAttributeFormSwitch'

interface Props {
  entity: EntityConfig<EntityModel>
  attribute?: ModelAttribute
  onChange: <T extends ModelAttribute>(key: keyof T, value: any) => void
  onKeyChange: (key: string) => void
}

export const ModelAttributeForm = (props: Props) => {
  const { entity, attribute, onChange, onKeyChange } = props
  const [type, setType] = useState<ModelAttribute['type'] | ''>(attribute?.type || '')

  const [attributeData, setAttributeData] = useState<ModelAttribute | undefined>(attribute)
  const [attributeKey, setAttributeKey] = useState('')

  const attributeIsNew = !attribute

  const handleNewAttributeKeyChange = (key: string) => {
    setAttributeKey(key)
    onKeyChange(key)
  }

  const handleTypeChange = (type: ModelAttribute['type'] | '') => {
    setAttributeData({
      ...(attributeData || {}),
      type: type as any,
    })
    handleAttrChange(onChange, 'type', type, setType)
  }

  return (
    <Grid container>
      {
        attributeIsNew ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleNewAttributeKeyChange(e.target.value as string)}
              value={attributeKey}
              name="attributeKey"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              label="Attribute Key"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <AttributeTypeSelector value={type} onChange={handleTypeChange}/>
      </Grid>

      <ModelAttributeFormSwitch entity={entity} attribute={attributeData} onChange={onChange} subAttribute={false}/>
    </Grid>
  )
}
