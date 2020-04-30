import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { Grid, TextField } from '@material-ui/core'
import { AuthProvider } from '@commun/users'
import { PluginService } from '../../services/PluginService'
import { MessageSnackbar, MessageSnackbarType } from '../MessageSnackbar'

interface Props {
  open: boolean
  provider: { key: AuthProvider, name: string, idLabel: string, secretLabel: string }
  onClose: () => void
}

export const SocialLoginCredentialsDialog = (props: Props) => {
  const theme = useTheme()
  const { open, onClose } = props
  const [provider, setProvider] = useState(props.provider)
  const [id, setId] = useState('')
  const [secret, setSecret] = useState('')
  const [message, setMessage] = useState<MessageSnackbarType>()

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    setProvider(props.provider)
    if (!open) {
      setId('')
      setSecret('')
    }
  }, [props.provider, open])

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await PluginService.updateSocialLoginCredentials(provider.key, { id, secret })
    } catch (e) {
      setMessage({ text: e.message, severity: 'error' })
    }
    onClose()
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">Update {provider.name} credentials</DialogTitle>

      <DialogContent>
        <form>
          <Grid container>
            <Grid item xs={12}>
              <TextField
                onChange={e => setId(e.target.value)}
                value={id}
                name="id"
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label={provider.idLabel}/>
            </Grid>

            <Grid item xs={12}>
              <TextField
                onChange={e => setSecret(e.target.value)}
                value={secret}
                name="secret"
                variant="outlined"
                margin="normal"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                label={provider.secretLabel}/>
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleUpdateClick} color="primary" autoFocus>
          Update
        </Button>
      </DialogActions>

      <MessageSnackbar message={message}/>
    </Dialog>
  )
}
