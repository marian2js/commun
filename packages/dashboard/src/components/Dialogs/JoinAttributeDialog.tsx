import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { EntityConfig, EntityModel, JoinAttribute } from '@commun/core'
import { JoinAttributeForm } from '../Forms/JoinAttributeForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
  attributeKey: string | undefined
  joinAttribute: JoinAttribute | undefined
  open: boolean
  onChange: (attributeKey: string, joinAttribute: JoinAttribute) => void
  onCancel: () => void
}

export const JoinAttributeDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, attributeKey, joinAttribute, open, onCancel, onChange } = props
  const [joinAttributeData, setJoinAttributeData] = useState<Partial<JoinAttribute> | undefined>(joinAttribute)
  const [newJoinAttributeKey, setNewJoinAttributeKey] = useState('')

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => setJoinAttributeData(joinAttribute), [joinAttribute])

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityJoinAttribute(entity.entityName, newJoinAttributeKey, joinAttributeData as JoinAttribute)
    onChange(newJoinAttributeKey, joinAttributeData as JoinAttribute)
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityJoinAttribute(entity.entityName, attributeKey!, joinAttributeData as JoinAttribute)
    onChange(attributeKey!, joinAttributeData as JoinAttribute)
  }

  const handleAttributeChange = (key: keyof JoinAttribute, value: any) => {
    if (!joinAttributeData) {
      setJoinAttributeData({ [key]: value })
      return
    }
    joinAttributeData[key as keyof JoinAttribute] = value
    setJoinAttributeData(joinAttributeData)
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">{
        attributeKey ? `Update "${attributeKey}"` : 'Add join attribute'
      }</DialogTitle>

      <DialogContent>
        <JoinAttributeForm entity={entity}
                           joinAttribute={joinAttribute}
                           onChange={handleAttributeChange}
                           onKeyChange={key => setNewJoinAttributeKey(key)}/>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        {
          attributeKey ?
            <Button onClick={handleUpdateClick} color="primary" autoFocus>
              Update
            </Button> :
            <Button onClick={handleAddClick} color="primary" autoFocus>
              Add join attribute
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
