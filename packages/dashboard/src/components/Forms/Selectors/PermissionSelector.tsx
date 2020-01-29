import React, { useEffect, useState } from 'react'
import { FormControl, FormHelperText, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { EntityActionPermissions, EntityPermission } from '@commun/core'

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1, 1, 3, 1),
    width: '100%',
  },
}))

interface Props {
  permission?: EntityPermission | 'default'
  permissionKey: keyof EntityActionPermissions
  helperText: JSX.Element
  entityName: string
  showDefault?: boolean
  onChange: (permission: EntityPermission | 'default') => void
}

export const PermissionSelector = (props: Props) => {
  const classes = useStyles()
  const { permissionKey, helperText, entityName, showDefault, onChange } = props
  const [permission, setPermission] = useState(props.permission || 'system')

  useEffect(() => setPermission(props.permission || 'system'), [props.permission])

  const handleChange = (permission: EntityPermission | 'default') => {
    setPermission(permission)
    onChange(permission)
  }

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id={`permissions-${permissionKey}-label`}>
        {capitalize(permissionKey)} Permission
      </InputLabel>
      <Select
        labelId={`permissions-${permissionKey}-label`}
        id={`permissions-${permissionKey}`}
        value={permission}
        fullWidth
        onChange={e => handleChange(e.target.value as EntityPermission | 'default')}>
        {
          showDefault ? <MenuItem value="default">Default for {capitalize(entityName)} attributes</MenuItem> : ''
        }
        <MenuItem value="anyone">Anyone</MenuItem>
        {
          entityName === 'users' && permissionKey === 'create' ? '' :
            <MenuItem value="user">Any authenticated user</MenuItem>
        }
        {
          permissionKey === 'create' ? '' :
            <MenuItem
              value="own">{entityName === 'users' ? 'The same user' : 'The user who owns the resource'}
            </MenuItem>
        }
        <MenuItem value="admin">Administrators</MenuItem>
        <MenuItem value="system">Only the system</MenuItem>
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}
