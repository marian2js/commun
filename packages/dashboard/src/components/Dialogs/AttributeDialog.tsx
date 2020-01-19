import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import { ModelAttributeForm } from '../Forms/ModelAttributeForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
  attributeKey: string | undefined
  attribute: ModelAttribute | undefined
  open: boolean
  onChange: (attributeKey: string, attribute: ModelAttribute) => void
  onCancel: () => void
}

export const AttributeDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, attributeKey, attribute, open, onCancel, onChange } = props
  const [attributeData, setAttributeData] = useState(attribute)
  const [newAttributeKey, setNewAttributeKey] = useState('')

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityAttribute(entity.entityName, newAttributeKey, attributeData!)
    onChange(newAttributeKey, attributeData!)
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityAttribute(entity.entityName, attributeKey!, attributeData!)
    onChange(attributeKey!, attributeData!)
  }

  const handleAttributeChange = (key: string | number | symbol, value: any) => {
    if (!attributeData) {
      if (key === 'type') {
        setAttributeData({
          type: value
        })
      }
      return
    }
    attributeData[key as keyof ModelAttribute] = value
    setAttributeData(attributeData)
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">{
        attributeKey ? `Update "${attributeKey}"` : 'Add attribute'
      }</DialogTitle>

      <DialogContent>
        <ModelAttributeForm entity={entity}
                            attribute={attribute}
                            onChange={handleAttributeChange}
                            onKeyChange={key => setNewAttributeKey(key)}/>
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
              Add attribute
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
