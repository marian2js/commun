import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { EntityConfig, EntityModel, JoinProperty } from '@commun/core'
import { JoinPropertyForm } from '../Forms/JoinPropertyForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
  propertyKey: string | undefined
  joinProperty: JoinProperty | undefined
  open: boolean
  onChange: (propertyKey: string, joinProperty: JoinProperty) => void
  onCancel: () => void
}

export const JoinPropertyDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, propertyKey, joinProperty, open, onCancel, onChange } = props
  const [joinPropertyData, setJoinPropertyData] = useState<Partial<JoinProperty> | undefined>(joinProperty)
  const [newJoinPropertyKey, setNewJoinPropertyKey] = useState('')

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => setJoinPropertyData(joinProperty), [joinProperty])

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityJoinProperty(entity.entityName, newJoinPropertyKey, joinPropertyData as JoinProperty)
    onChange(newJoinPropertyKey, joinPropertyData as JoinProperty)
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityJoinProperty(entity.entityName, propertyKey!, joinPropertyData as JoinProperty)
    onChange(propertyKey!, joinPropertyData as JoinProperty)
  }

  const handlePropertyChange = (key: keyof JoinProperty, value: any) => {
    if (!joinPropertyData) {
      setJoinPropertyData({ [key]: value })
      return
    }
    joinPropertyData[key as keyof JoinProperty] = value
    setJoinPropertyData(joinPropertyData)
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="property-dialog-title">

      <DialogTitle id="property-dialog-title">{
        propertyKey ? `Update "${propertyKey}"` : 'Add join property'
      }</DialogTitle>

      <DialogContent>
        <JoinPropertyForm entity={entity}
                          joinProperty={joinProperty}
                          onChange={handlePropertyChange}
                          onKeyChange={key => setNewJoinPropertyKey(key)}/>
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
              Add join property
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
