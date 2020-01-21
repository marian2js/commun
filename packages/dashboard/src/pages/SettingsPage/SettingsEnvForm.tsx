import React, { FormEvent, useState } from 'react'
import { CommunOptions } from '@commun/core'
import { Button, Card, Grid, makeStyles, TextField } from '@material-ui/core'
import { SettingsService } from '../../services/SettingsService'

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
}

export const SettingsEnvForm = (props: Props) => {
  const classes = useStyles()
  const { settings, environment } = props
  const [appName, setAppName] = useState(settings.appName)
  const [endpoint, setEndpoint] = useState(settings.endpoint)
  const [port, setPort] = useState(settings.port)
  const [mongoDbUri, setMongoDbUri] = useState(settings.mongoDB.uri)
  const [mongoDbName, setMongoDbName] = useState(settings.mongoDB.dbName)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await SettingsService.setSettings(environment, {
      appName,
      endpoint,
      port,
      mongoDB: {
        ...settings.mongoDB,
        uri: mongoDbUri,
        dbName: mongoDbName,
      }
    })
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
            <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
              Update Settings
            </Button>
          </Grid>

        </Grid>
      </form>
    </Card>
  )
}
