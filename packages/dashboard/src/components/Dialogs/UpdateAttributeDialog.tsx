import React from 'react'
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

interface Props {
  attributeKey: string
  attribute: ModelAttribute | undefined
  open: boolean
  onClose: () => void
}

export const UpdateAttributeDialog = (props: Props) => {
  const theme = useTheme()

  const { attributeKey, attribute, open, onClose } = props
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleUpdateClicked = () => {

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

          <ModelAttributeForm attributeKey={attributeKey} attribute={attribute}/>

        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleUpdateClicked} color="primary" autoFocus>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  )
}
