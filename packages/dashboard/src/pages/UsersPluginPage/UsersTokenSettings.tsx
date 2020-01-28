import React, { FormEvent, useEffect, useState } from 'react'
import { UserModuleSettings } from '@commun/users'
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  makeStyles,
  TextField
} from '@material-ui/core'
import { PluginService } from '../../services/PluginService'
import { Color } from '@material-ui/lab'
import { MessageSnackbar } from '../../components/MessageSnackbar'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  submitButton: {
    float: 'right',
    margin: theme.spacing(3, 0, 0, 0),
  },
  accessTokenInput: {
    marginBottom: theme.spacing(2),
  },
}))

interface Props {
  plugin: UserModuleSettings
}

export const UsersTokenSettings = (props: Props) => {
  const classes = useStyles()
  const { plugin } = props
  const [accessTokenExpiration, setAccessTokenExpiration] = useState(plugin.accessToken.expiresIn)
  const [refreshTokenEnabled, setRefreshTokenEnabled] = useState(plugin.refreshToken.enabled)
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => setAccessTokenExpiration(props.plugin.accessToken.expiresIn), [props.plugin])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await PluginService.updatePlugin('users', {
        accessToken: {
          ...plugin.accessToken,
          expiresIn: accessTokenExpiration,
        },
        refreshToken: {
          ...(plugin.refreshToken || {}),
          enabled: refreshTokenEnabled,
        },
      })
      setMessage({ text: 'Settings successfully updated.', severity: 'success' })
    } catch (e) {
      setMessage({ text: e.message, severity: 'error' })
    }
  }

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <Grid container>
        <Grid item xs={12} className={classes.accessTokenInput}>
          <TextField
            onChange={e => setAccessTokenExpiration(e.target.value)}
            value={accessTokenExpiration}
            name="accessTokenExpiration"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Access Token Expiration Time"/>
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={refreshTokenEnabled}
                                   onChange={() => setRefreshTokenEnabled(!refreshTokenEnabled)}/>}
                label="Refresh Token Enabled"/>
            </FormGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
            Update
          </Button>
        </Grid>
      </Grid>

      <MessageSnackbar message={message}/>
    </form>
  )
}
