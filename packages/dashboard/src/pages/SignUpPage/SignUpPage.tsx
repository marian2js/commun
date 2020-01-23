import React, { ChangeEvent, FormEvent, useState } from 'react'
import { Redirect } from 'react-router'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import CssBaseline from '@material-ui/core/CssBaseline'
import TextField from '@material-ui/core/TextField'
import LockOutlinedIcon from '@material-ui/icons/LockOutlined'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Alert from '@material-ui/lab/Alert'
import { UserService } from '../../services/UserService'
import { routes } from '../../routes'

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}))

export function SignUpPage () {
  const classes = useStyles()
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loggedIn, setLoggedIn] = useState<boolean>(false)
  const code = new URLSearchParams(window.location.search).get('code')

  if (!code) {
    return <Redirect to={routes.Login.path}/>
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await UserService.register({ email, username, password, code })
      setLoggedIn(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setUsername(e.target.value)
    setError(null)
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setEmail(e.target.value)
    setError(null)
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setPassword(e.target.value)
    setError(null)
  }

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setConfirmPassword(e.target.value)
    setError(null)
  }

  if (loggedIn) {
    return <Redirect to={routes.Home.path}/>
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon/>
        </Avatar>
        <Typography component="h1" variant="h5">
          Create admin account
        </Typography>

        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            onChange={handleEmailChange}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="email"
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus/>

          <TextField
            onChange={handleUsernameChange}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"/>

          <TextField
            onChange={handlePasswordChange}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"/>

          <TextField
            onChange={handleConfirmPasswordChange}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"/>

          {
            error ? <Alert severity="error">{error}</Alert> : ''
          }

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}>
            Sign Up
          </Button>
        </form>

      </div>
    </Container>
  )
}
