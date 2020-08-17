import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { EntityConfig, EntityModel } from '@commun/core'
import { SchemaPropertyForm } from '../Forms/SchemaPropertyForms/SchemaPropertyForm'
import { EntityService } from '../../services/EntityService'
import { JSONSchema7 } from 'json-schema'

interface Props {
  entity: EntityConfig<EntityModel>
  propertyKey: string | undefined
  property: JSONSchema7 | undefined
  open: boolean
  onChange: (propertyKey: string, property: JSONSchema7) => void
  onCancel: () => void
}

export const PropertyDialog = (props: Props) => {
  const theme = useTheme()
  const { propertyKey, open, onCancel, onChange } = props
  const [propertyData, setPropertyData] =
    useState<JSONSchema7 | undefined>(props.property ? { ...props.property } : undefined)
  const [entity, setEntity] = useState(props.entity)
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [required, setRequired] = useState<boolean | undefined>()

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    setPropertyData(props.property ? { ...props.property } : undefined)
    setEntity(props.entity)
  }, [props.property, open, props.entity])

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityProperty(entity.entityName, newPropertyKey, propertyData!, required)
    onChange(newPropertyKey, propertyData!)
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityProperty(entity.entityName, propertyKey!, propertyData!, required)
    onChange(propertyKey!, propertyData!)
  }

  const handlePropertyChange = (key: string, value: any) => {
    setPropertyData({
      ...(propertyData || {}),
      [key]: value,
    })
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="property-dialog-title">

      <DialogTitle id="property-dialog-title">{
        propertyKey ? `Update "${propertyKey}"` : 'Add property'
      }</DialogTitle>

      <DialogContent>
        <SchemaPropertyForm entity={entity}
                            property={propertyData}
                            propertyKey={propertyKey}
                            newProperty={!props.property}
                            onChange={handlePropertyChange}
                            onKeyChange={setNewPropertyKey}
                            onRequiredChange={setRequired}/>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        {
          propertyKey ?
            <Button onClick={handleUpdateClick} color="primary" autoFocus>
              Update
            </Button> :
            <Button onClick={handleAddClick} color="primary" autoFocus>
              Add property
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
