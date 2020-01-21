import React, { FormEvent, useEffect, useState } from 'react'
import { EmailConfig } from '@commun/emails'
import { Button, Grid, makeStyles, TextField } from '@material-ui/core'
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
  header: {
    marginBottom: theme.spacing(2),
  },
}))

interface Props {
  plugin: EmailConfig
}

export const EmailPluginSettings = (props: Props) => {
  const classes = useStyles()
  const [sendFrom, setSendFrom] = useState()
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => setSendFrom(props.plugin.sendFrom), [props.plugin])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await PluginService.updatePlugin('emails', { sendFrom })
      setMessage({ text: 'Settings successfully updated.', severity: 'success' })
    } catch (e) {
      setMessage({ text: e.message, severity: 'error' })
    }
  }

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <Grid container>
        <Grid item xs={12}>
          <TextField
            onChange={e => setSendFrom(e.target.value)}
            value={sendFrom}
            name="sendFrom"
            type="email"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Email to send from"/>
        </Grid>
      </Grid>

      {
        message ? <Alert severity={message.severity}>{message.text}</Alert> : ''
      }

      <Grid item xs={12}>
        <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
          Update
        </Button>
      </Grid>
    </form>
  )
}
