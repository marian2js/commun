import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { ModelAttribute } from '@commun/core'
import { ModelAttributeForm } from '../Forms/ModelAttributeForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entityName: string
  attributeKey: string
  attribute: ModelAttribute
  open: boolean
  onClose: () => void
}

export const UpdateAttributeDialog = (props: Props) => {
  const theme = useTheme()
  const { entityName, attributeKey, attribute, open, onClose } = props
  const [updatedAttribute, setUpdatedAttribute] = useState(attribute)

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await EntityService.updateEntityAttribute(entityName, attributeKey, updatedAttribute)
    props.onClose()
  }

  const handleAttributeChange = (key: string | number | symbol, value: any) => {
    updatedAttribute[key as keyof ModelAttribute] = value
    setUpdatedAttribute(updatedAttribute)
  }

  if (!attribute) {
    return <span/>
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title">
      <DialogTitle id="responsive-dialog-title">Update "{attributeKey}"</DialogTitle>
      <DialogContent>
        <DialogContentText>

          <ModelAttributeForm attribute={attribute} onChange={handleAttributeChange}/>

        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleUpdateClick} color="primary" autoFocus>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  )
}
