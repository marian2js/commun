import React, { FormEvent, useEffect, useState } from 'react'
import { Button, Grid, makeStyles, TextField } from '@material-ui/core'
import { EntityConfig, EntityModel } from '@commun/core'
import { EntityService } from '../../services/EntityService'
import { Alert, Color } from '@material-ui/lab'
import { PropertySelector } from '../../components/Forms/Selectors/PropertySelector'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  apiAttributeSelectorFormControl: {
    margin: theme.spacing(2, 1, 2),
    width: '100%',
  },
  submitButton: {
    float: 'right',
    margin: theme.spacing(3, 0, 0, 0),
  }
}))

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntitySettings = (props: Props) => {
  const classes = useStyles()
  const { entity } = props
  const [entityName, setEntityName] = useState(entity.entityName)
  const [collectionName, setCollectionName] = useState(entity.collectionName)
  const [apiKey, setApiKey] = useState(entity.apiKey)
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => {
    setEntityName(entity.entityName)
    setCollectionName(entity.collectionName)
    setApiKey(entity.apiKey)
    setMessage(undefined)
  }, [entity])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await EntityService.updateEntity(entity.entityName, {
        entityName,
        collectionName,
        apiKey
      })
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
            onChange={e => setEntityName(e.target.value)}
            value={entityName}
            name="entityName"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Entity Name"/>
        </Grid>

        <Grid item xs={12}>
          <TextField
            onChange={e => setCollectionName(e.target.value)}
            value={collectionName}
            name="collectionName"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Collection Name"/>
        </Grid>

        <Grid item xs={12}>
          <PropertySelector value={apiKey || 'id'}
                            label="Attribute used by API endpoints"
                            entity={entity}
                            onChange={setApiKey}
                            className={classes.apiAttributeSelectorFormControl}/>
        </Grid>

        {
          message ? <Alert severity={message.severity}>{message.text}</Alert> : ''
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
