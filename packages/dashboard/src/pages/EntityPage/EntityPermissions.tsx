import React, { FormEvent, useEffect, useState } from 'react'
import { Button, Grid, makeStyles } from '@material-ui/core'
import { EntityActionPermissions, EntityConfig, EntityModel } from '@commun/core'
import { Color } from '@material-ui/lab'
import { EntityService } from '../../services/EntityService'
import { PermissionSelector } from '../../components/Forms/Selectors/PermissionSelector'
import { MessageSnackbar } from '../../components/MessageSnackbar'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  submitButton: {
    float: 'right',
    margin: theme.spacing(1, 0, 0, 0),
  },
  formControl: {
    margin: theme.spacing(1, 1, 3, 1),
    width: '100%',
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityPermissions = (props: Props) => {
  const classes = useStyles()
  const { entity } = props
  const [permissions, setPermissions] = useState(Array.isArray(entity.permissions) ? entity.permissions[0] : entity.permissions)
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => {
    setPermissions(Array.isArray(entity.permissions) ? entity.permissions[0] : entity.permissions)
    setMessage(undefined)
  }, [entity])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await EntityService.updateEntity(entity.entityName, {
        permissions
      })
      setMessage({ text: 'Settings successfully updated.', severity: 'success' })
    } catch (e) {
      setMessage({ text: e.message, severity: 'error' })
    }
  }

  const getPermissionsSelector = (permissionKey: keyof EntityActionPermissions, helperText: JSX.Element) => {
    return (
      <Grid item xs={12}>
        <PermissionSelector permission={(permissions || {})[permissionKey]}
                            permissionKey={permissionKey}
                            helperText={helperText}
                            entityName={entity.entityName}
                            onChange={permission => {
                              setPermissions({
                                ...permissions,
                                [permissionKey]: permission,
                              })
                            }}/>
      </Grid>
    )
  }

  return (
    <form className={classes.form} onSubmit={handleSubmit}>
      <Grid container>
        {
          getPermissionsSelector('get', <span>Who can get <strong>{entity.entityName}</strong>?</span>)
        }
        {
          getPermissionsSelector('create', <span>Who can create <strong>{entity.entityName}</strong>?</span>)
        }
        {
          getPermissionsSelector('update', <span>Who can update <strong>{entity.entityName}</strong>?</span>)
        }
        {
          getPermissionsSelector('delete', <span>Who can delete <strong>{entity.entityName}</strong>?</span>)
        }

        <MessageSnackbar message={message}/>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" className={classes.submitButton}>
            Update
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}
