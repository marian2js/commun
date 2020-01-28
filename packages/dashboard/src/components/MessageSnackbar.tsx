import React, { useEffect, useState } from 'react'
import { Snackbar } from '@material-ui/core'
import { Alert, Color } from '@material-ui/lab'

interface Props {
  message?: { text: string, severity?: Color }
}

export const MessageSnackbar = (props: Props) => {
  const [message, setMessage] = useState(props.message?.text)
  const [severity, setSeverity] = useState(props.message?.severity)

  useEffect(() => {
    setMessage(props.message?.text)
    setSeverity(props.message?.severity)
  }, [props.message])

  return (
    <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(undefined)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert onClose={() => setMessage(undefined)} severity={severity || 'info'}>
        {message}
      </Alert>
    </Snackbar>
  )
}
