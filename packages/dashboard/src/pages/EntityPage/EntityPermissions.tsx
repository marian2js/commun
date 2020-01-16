import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Button, FormControl, FormHelperText, Grid, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { EntityActionPermissions, EntityConfig, EntityModel } from '@commun/core'
import { Alert, Color } from '@material-ui/lab'
import capitalize from '@material-ui/core/utils/capitalize'
import { EntityService } from '../../services/EntityService'

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
  const [permissions, setPermissions] = useState(entity.permissions)
  const [message, setMessage] = useState<{ text: string, severity: Color }>()

  useEffect(() => {
    setPermissions(entity.permissions)
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

  const handleChange = (e: ChangeEvent<{ value: unknown }>, permissionKey: string) => {
    e.preventDefault()
    setPermissions({
      ...permissions,
      [permissionKey]: e.target.value,
    })
  }

  const getPermissionsSelector = (permissionKey: keyof EntityActionPermissions, helperText: JSX.Element) => {
    return (
      <Grid item xs={12}>
        <FormControl className={classes.formControl}>
          <InputLabel id={`permissions-${permissionKey}-label`}>
            {capitalize(permissionKey)} Permission
          </InputLabel>
          <Select
            labelId={`permissions-${permissionKey}-label`}
            id={`permissions-${permissionKey}`}
            value={(permissions || {})[permissionKey] || 'system'}
            fullWidth
            onChange={e => handleChange(e, permissionKey)}>
            <MenuItem value="anyone">Anyone</MenuItem>
            {
              entity.entityName === 'users' && permissionKey === 'create' ? '' :
                <MenuItem value="user">Any authenticated user</MenuItem>
            }
            {
              permissionKey === 'create' ? '' :
                <MenuItem
                  value="own">{entity.entityName === 'users' ? 'The same user' : 'The user who owns the resource'}
                </MenuItem>
            }
            <MenuItem value="admin">Administrators</MenuItem>
            <MenuItem value="system">Only the system</MenuItem>
          </Select>
          <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
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
