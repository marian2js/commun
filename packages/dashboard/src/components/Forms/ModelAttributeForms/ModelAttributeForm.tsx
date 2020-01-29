import { Grid, TextField } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { EntityActionPermissions, EntityConfig, EntityModel, EntityPermission, ModelAttribute } from '@commun/core'
import { handleAttrChange } from '../../../utils/attributes'
import { AttributeTypeSelector } from '../Selectors/AttributeTypeSelector'
import { ModelAttributeFormSwitch } from './ModelAttributeFormSwitch'
import { TextDivider } from '../../TextDivider'
import { PermissionSelector } from '../Selectors/PermissionSelector'

interface Props {
  entity: EntityConfig<EntityModel>
  attribute?: ModelAttribute
  onChange: <T extends ModelAttribute>(key: keyof T, value: any) => void
  onKeyChange: (key: string) => void
}

export const ModelAttributeForm = (props: Props) => {
  const { entity, attribute, onChange, onKeyChange } = props
  const [type, setType] = useState<ModelAttribute['type'] | ''>(attribute?.type || '')
  const [attributeData, setAttributeData] = useState<ModelAttribute | undefined>(attribute ? { ...attribute } : undefined)
  const [attributeKey, setAttributeKey] = useState('')
  const [attributeIsNew, setAttributeIsNew] = useState(!attribute)
  const [permissions, setPermissions] = useState(Array.isArray(attribute?.permissions) ? attribute?.permissions[0] : attribute?.permissions)

  useEffect(() => {
    setType(attribute?.type || '')
    setAttributeData(attribute ? { ...attribute } : undefined)
    setAttributeKey('')
    setAttributeIsNew(!attribute)
    setPermissions(Array.isArray(attribute?.permissions) ? attribute?.permissions[0] : attribute?.permissions)
  }, [attribute])

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

  const getPermissionsSelector = (permissionKey: keyof EntityActionPermissions, helperText: JSX.Element) => {
    const onPermissionChange = (permission: EntityPermission | 'default') => {
      const newPermissions = {
        ...permissions,
        [permissionKey]: permission === 'default' ? undefined : permission,
      }
      setPermissions(newPermissions)
      onChange('permissions', newPermissions)
    }

    return (
      <Grid item xs={12}>
        <PermissionSelector permission={(permissions || {})[permissionKey] || 'default'}
                            permissionKey={permissionKey}
                            helperText={helperText}
                            entityName={entity.entityName}
                            showDefault={true}
                            onChange={onPermissionChange}/>
      </Grid>
    )
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

      <Grid item xs={12}>
        <TextDivider><span>Attribute permissions</span></TextDivider>
      </Grid>

      {
        getPermissionsSelector('get', <span>Who can get this attribute?</span>)
      }
      {
        getPermissionsSelector('create',
          <span>Who can set this attribute while creating a <strong>{entity.entityName}</strong>?</span>
        )
      }
      {
        getPermissionsSelector('update',
          <span>Who can set this attribute while updating a <strong>{entity.entityName}</strong>?</span>
        )
      }
    </Grid>
  )
}
