import React, { useEffect, useState } from 'react'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import { EntityConfig, EntityModel } from '@commun/core'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import Typography from '@material-ui/core/Typography'
import { Grid, TextField } from '@material-ui/core'
import { EntityService } from '../../services/EntityService'
import { Redirect } from 'react-router'

interface Props {
  entity: EntityConfig<EntityModel>
  open: boolean
  onCancel: () => void
}

export const DeleteEntityDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, open, onCancel } = props
  const [confirmEntityName, setConfirmEntityName] = useState('')
  const [entityDeleted, setEntityDeleted] = useState(false)

  useEffect(() => setConfirmEntityName(''), [open])

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleDeleteClick = async () => {
    if (confirmEntityName === entity.entityName) {
      await EntityService.deleteEntity(entity.entityName)
      setEntityDeleted(true)
    }
  }

  if (entityDeleted) {
    return <Redirect to="/"/>
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">
        Are you sure you want to delete "{entity.entityName}"?
      </DialogTitle>

      <DialogContent>
        <Typography paragraph>
          You are about to delete the entity <strong>{entity.entityName}</strong>.
          This action <strong>cannot</strong> be undone.
        </Typography>
        <Typography paragraph>
          Please type <strong>{entity.entityName}</strong> to confirm:
        </Typography>

        <Grid item xs={12}>
          <TextField
            onChange={e => setConfirmEntityName(e.target.value as string)}
            value={confirmEntityName}
            name="name"
            variant="outlined"
            margin="normal"
            fullWidth/>
        </Grid>

      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={handleDeleteClick}
                color="secondary"
                disabled={entity.entityName !== confirmEntityName}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
