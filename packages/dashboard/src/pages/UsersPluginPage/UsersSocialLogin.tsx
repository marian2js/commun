import React, { FormEvent, useState } from 'react'
import { AuthProvider, UserModuleSettings } from '@commun/users'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Link,
  makeStyles,
  TextField
} from '@material-ui/core'
import { SocialLoginCredentialsDialog } from '../../components/Dialogs/SocialLoginCredentialsDialog'
import { PluginService } from '../../services/PluginService'
import { MessageSnackbar } from '../../components/MessageSnackbar'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  submitButton: {
    float: 'right',
    margin: theme.spacing(2, 0, 0, 0),
  },
}))

interface Props {
  plugin: UserModuleSettings
}

type ProviderData = { key: AuthProvider, name: string, idLabel: string, secretLabel: string }

export const UsersSocialLogin = (props: Props) => {
  const classes = useStyles()
  const externalAuth = props.plugin.externalAuth
  const [providers, setProviders] = useState(externalAuth?.providers || {})
  const [callbackUrl, setCallbackUrl] = useState(externalAuth?.callbackUrl || '')
  const [autoGenerateUsername, setAutoGenerateUsername] = useState(externalAuth?.autoGenerateUsername || false)
  const [changeCredentialsDialogOpen, setChangeCredentialsDialogOpen] = useState(false)
  const [changeCredentialsProvider, setChangeCredentialsProvider] = useState<ProviderData | undefined>()
  const [message, setMessage] = useState()

  const providersData: ProviderData[] = [{
    key: 'google',
    name: 'Google',
    idLabel: 'Google Client ID',
    secretLabel: 'Google Client Secret',
  }, {
    key: 'facebook',
    name: 'Facebook',
    idLabel: 'Facebook APP ID',
    secretLabel: 'Facebook APP Secret',
  }, {
    key: 'github',
    name: 'GitHub',
    idLabel: 'GitHub Client ID',
    secretLabel: 'GitHub Client Secret',
  }]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await PluginService.updatePlugin('users', {
        externalAuth: {
          ...props.plugin.externalAuth,
          callbackUrl,
          autoGenerateUsername,
          providers,
        },
      })
      setMessage({ text: 'Successfully updated', severity: 'success' })
    } catch (e) {
      setMessage({ text: e.message, severity: 'error' })
    }
  }

  const handleProviderEnableChange = (providerData: ProviderData) => {
    const enabled = !!providers[providerData.key]?.enabled
    const newProviders = {
      ...providers,
      [providerData.key]: {
        enabled: !enabled
      }
    }
    setProviders(newProviders)
  }

  const handleChangeCredentialsClick = (providerData: ProviderData) => {
    setChangeCredentialsDialogOpen(true)
    setChangeCredentialsProvider(providerData)
  }

  return (
    <>
      <form className={classes.form} onSubmit={handleSubmit}>
        <Grid container>

          <Box mb={3}>
            {
              providersData.map(providerData => (
                <Grid container key={providerData.key}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={providers[providerData.key]?.enabled || false}
                                             onChange={() => handleProviderEnableChange(providerData)}/>}
                          label={`${providerData.name} auth enabled`}/>
                      </FormGroup>
                    </FormControl>
                  </Grid>

                  {
                    providers[providerData.key]?.enabled ?
                      <Link href="#" onClick={() => handleChangeCredentialsClick(providerData)}>
                        Change {providerData.name} client ID or client secret
                      </Link> : ''
                  }
                </Grid>
              ))
            }
          </Box>

          <Grid item xs={12}>
            <TextField
              onChange={e => setCallbackUrl(e.target.value)}
              value={callbackUrl}
              name="callbackUrl"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              helperText="URL to redirect the user after a successful authentication"
              label="Callback URL"/>
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={autoGenerateUsername}
                                     onChange={() => setAutoGenerateUsername(!autoGenerateUsername)}/>}
                  label="Auto-generate username"/>
                <FormHelperText>Automatically set a free username using the user's name</FormHelperText>
              </FormGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
              Update
            </Button>
          </Grid>
        </Grid>
      </form>

      {
        changeCredentialsProvider ?
          <SocialLoginCredentialsDialog
            provider={changeCredentialsProvider}
            open={changeCredentialsDialogOpen}
            onClose={() => setChangeCredentialsDialogOpen(false)}/> : ''
      }

      <MessageSnackbar message={message}/>
    </>
  )
}
