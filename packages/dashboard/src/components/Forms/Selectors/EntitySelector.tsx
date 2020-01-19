import React, { useEffect, useState } from 'react'
import { EntityService } from '../../../services/EntityService'
import { CircularProgress, FormControl, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { EntityConfig, EntityModel } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'

const useStyles = makeStyles(theme => ({
  entitySelectorFormControl: {
    margin: theme.spacing(4, 1, 2),
    width: '100%',
  },
}))

interface Props {
  value?: string
  entities?: EntityConfig<EntityModel>[]
  onChange?: (entityName: string, entity?: EntityConfig<EntityModel>) => void
}

export const EntitySelector = (props: Props) => {
  const classes = useStyles()
  const { value, onChange } = props
  const [entities, setEntities] = useState<EntityConfig<EntityModel>[]>(props.entities || [])

  useEffect(() => {
    (async () => {
      if (!entities.length) {
        const res = await EntityService.getEntities()
        setEntities(res.items)
      }
    })()
  }, [entities.length])

  if (!entities) {
    return <CircularProgress/>
  }

  const handleEntityChange = (entityName: string) => {
    if (onChange) {
      onChange(entityName, entities.find(entity => entity.entityName === entityName))
    }
  }

  return (
    <FormControl className={classes.entitySelectorFormControl}>
      <InputLabel id="entity-selector">
        Entity Reference
      </InputLabel>
      <Select
        onChange={e => handleEntityChange(e.target.value as string)}
        value={value || ''}
        labelId="entity-selector"
        id="entity-selector"
        fullWidth>
        {
          entities.map(entity => (
            <MenuItem key={entity.entityName} value={entity.entityName}>{capitalize(entity.entityName)}</MenuItem>
          ))
        }
      </Select>
    </FormControl>
  )
}
