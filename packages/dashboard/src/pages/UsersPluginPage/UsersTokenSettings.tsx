import React, { FormEvent, useEffect, useState } from 'react'
import { UserModuleOptions } from '@commun/users'
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  makeStyles,
  Snackbar,
  TextField
} from '@material-ui/core'
import { PluginService } from '../../services/PluginService'
import { Alert, Color } from '@material-ui/lab'

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
  plugin: UserModuleOptions
}

export const UsersTokenSettings = (props: Props) => {
  const classes = useStyles()
  const { plugin } = props
  const [accessTokenExpiration, setAccessTokenExpiration] = useState(plugin.accessToken.signOptions.expiresIn)
  const [refreshTokenEnabled, setRefreshTokenEnabled] = useState(plugin.refreshToken.enabled)
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => setAccessTokenExpiration(props.plugin.accessToken.signOptions.expiresIn), [props.plugin])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await PluginService.updatePlugin('users', {
        accessToken: {
          ...plugin.accessToken,
          signOptions: {
            ...(plugin.accessToken.signOptions || {}),
            expiresIn: accessTokenExpiration,
          },
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

        {
          message ?
            <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(undefined)}
                      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
              <Alert onClose={() => setMessage(undefined)} severity={message.severity}>
                Settings updated
              </Alert>
            </Snackbar> : ''
        }

        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
            Update
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}
