import React, { FormEvent, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  makeStyles,
  TextField
} from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { EntityService } from '../../services/EntityService'
import { Redirect } from 'react-router'
import capitalize from '@material-ui/core/utils/capitalize'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  card: {
    padding: theme.spacing(5),
  },
  submitButton: {
    float: 'right',
    marginTop: theme.spacing(3),
  }
}))

export const AddEntityPage = () => {
  const classes = useStyles()
  const [entityName, setEntityName] = useState('')
  const [entityCreated, setEntityCreated] = useState(false)
  const [addUser, setAddUser] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validForm()) {
      return
    }
    setLoading(true)
    await EntityService.createEntity({ entityName, addUser })
    await EntityService.waitUntilEntityExist(entityName)
    setLoading(false)
    setEntityCreated(true)
  }

  const validForm = () => {
    return !!entityName
  }

  if (loading) {
    return <CircularProgress/>
  }

  if (entityCreated) {
    return <Redirect to={`/entities/${entityName}`}/>
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Card className={classes.card}>
          <form className={classes.form} onSubmit={handleSubmit}>
            <Grid container>
              <Grid item xs={12}>
                <TextField
                  onChange={e => setEntityName(e.target.value)}
                  value={entityName}
                  name="entityName"
                  variant="outlined"
                  margin="normal"
                  required
                  autoFocus
                  fullWidth
                  helperText="Best practice is to set a plural name in camelCase"
                  label="Entity Name"/>
              </Grid>
            </Grid>

            {
              entityName ?
                <Box mt={2}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox checked={addUser} onChange={() => setAddUser(!addUser)}/>}
                          label={<>Users can create <strong>{capitalize(entityName)}</strong></>}/>
                      </FormGroup>
                    </FormControl>
                  </Grid>
                </Box> : ''
            }

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" className={classes.submitButton}
                      disabled={!validForm()}>
                Add entity
              </Button>
            </Grid>
          </form>
        </Card>
      </Container>
    </Layout>
  )
}
