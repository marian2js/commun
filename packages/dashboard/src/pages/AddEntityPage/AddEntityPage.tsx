import React, { FormEvent, useState } from 'react'
import { Button, Card, CircularProgress, Container, Grid, makeStyles, TextField } from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { EntityService } from '../../services/EntityService'
import { Redirect } from 'react-router'

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

export const AddEntityPage = () => {
  const classes = useStyles()
  const [entityName, setEntityName] = useState('')
  const [entityCreated, setEntityCreated] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!entityName) {
      return
    }
    setLoading(true)
    await EntityService.createEntity(entityName)
    await EntityService.waitUntilEntityExist(entityName)
    setLoading(false)
    setEntityCreated(true)
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
                  label="Entity Name"/>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
                Add entity
              </Button>
            </Grid>
          </form>
        </Card>
      </Container>
    </Layout>
  )
}
