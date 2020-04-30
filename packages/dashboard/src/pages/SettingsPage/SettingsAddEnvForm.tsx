import React, { FormEvent, useState } from 'react'
import { Button, Card, Grid, makeStyles, TextField } from '@material-ui/core'
import { SettingsService } from '../../services/SettingsService'
import { CommunOptions } from '@commun/core'

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
  onEnvironmentAdded: (environment: string, settings: CommunOptions) => void
}

export const SettingsAddEnvForm = (props: Props) => {
  const classes = useStyles()
  const [envName, setEnvName] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const settings = { mongoDB: { uri: '', dbName: '' } }
    await SettingsService.setSettings(envName, settings)
    props.onEnvironmentAdded(envName, settings)
  }

  return (
    <Card className={classes.card}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <Grid container>
          <Grid item xs={12}>
            <TextField
              onChange={e => setEnvName(e.target.value.toLowerCase())}
              value={envName}
              name="envName"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Environment Name"/>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
              Add environment
            </Button>
          </Grid>
        </Grid>
      </form>
    </Card>
  )
}
