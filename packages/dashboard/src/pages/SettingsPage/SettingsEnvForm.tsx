import React, { FormEvent, useEffect, useState } from 'react'
import { CommunOptions } from '@commun/core'
import { Box, Button, Card, Grid, makeStyles, TextField } from '@material-ui/core'
import { SettingsService } from '../../services/SettingsService'
import { TextDivider } from '../../components/TextDivider'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  card: {
    padding: theme.spacing(5),
  },
  submitButton: {
    float: 'right',
    margin: theme.spacing(3, 0, 0, 0),
  }
}))

interface Props {
  settings: CommunOptions
  environment: string
  onUpdate: (environment: string, settings: CommunOptions) => void
}

export const SettingsEnvForm = (props: Props) => {
  const classes = useStyles()
  const { settings, environment, onUpdate } = props
  const [appName, setAppName] = useState(settings.appName)
  const [endpoint, setEndpoint] = useState(settings.endpoint)
  const [port, setPort] = useState(settings.port)
  const [mongoDbUri, setMongoDbUri] = useState(settings.mongoDB.uri)
  const [mongoDbName, setMongoDbName] = useState(settings.mongoDB.dbName)
  const [loggerRequest, setLoggerRequest] = useState(settings.logger?.request || '')

  useEffect(() => {
    setAppName(props.settings.appName)
    setEndpoint(props.settings.endpoint)
    setPort(props.settings.port)
    setMongoDbUri(props.settings.mongoDB.uri)
    setMongoDbName(props.settings.mongoDB.dbName)
    setLoggerRequest(props.settings.logger?.request || '')
  }, [props.settings])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const newSettings = {
      appName,
      endpoint,
      port,
      mongoDB: {
        ...settings.mongoDB,
        uri: mongoDbUri,
        dbName: mongoDbName,
      },
      logger: {
        request: loggerRequest || undefined,
      },
    }
    await SettingsService.setSettings(environment, newSettings)
    onUpdate(environment, newSettings)
  }

  return (
    <Card className={classes.card}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <Grid container>
          <Grid item xs={12}>
            <TextField
              onChange={e => setAppName(e.target.value)}
              value={appName}
              name="appName"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="App Name"/>
          </Grid>

          <Grid item xs={12}>
            <TextField
              onChange={e => setEndpoint(e.target.value)}
              value={endpoint}
              name="endpoint"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Endpoint"/>
          </Grid>

          <Grid item xs={12}>
            <TextField
              onChange={e => setPort(e.target.value ? Number(e.target.value) : undefined)}
              value={port}
              name="port"
              type="number"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Port"/>
          </Grid>

          <Grid item xs={12}>
            <Box mt={2} mb={2}>
              <TextDivider><span>MongoDB Settings</span></TextDivider>
            </Box>
            <TextField
              onChange={e => setMongoDbUri(e.target.value)}
              value={mongoDbUri}
              name="mongoDbUri"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="MongoDB URI"/>
          </Grid>

          <Grid item xs={12}>
            <TextField
              onChange={e => setMongoDbName(e.target.value)}
              value={mongoDbName}
              name="mongoDbName"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="MongoDB database name"/>
          </Grid>

          <Grid item xs={12}>
            <Box mt={2} mb={2}>
              <TextDivider><span>Logger Settings</span></TextDivider>
            </Box>
            <TextField
              onChange={e => setLoggerRequest(e.target.value)}
              value={loggerRequest}
              name="requestLogger"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Request log"
              helperText="Information logged on every request. Leave empty for disabling request logging."/>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
              Update Settings
            </Button>
          </Grid>

        </Grid>
      </form>
    </Card>
  )
}
