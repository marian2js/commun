import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, RefModelAttribute } from '@commun/core'
import { CircularProgress, FormControl, Grid, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core'
import { TextDivider } from '../TextDivider'
import { EntityService } from '../../services/EntityService'
import capitalize from '@material-ui/core/utils/capitalize'
import { handleAttrChange } from '../../utils/attributes'

const useStyles = makeStyles(theme => ({
  entitySelectorFormControl: {
    margin: theme.spacing(4, 1, 2),
    width: '100%',
  },
}))

interface Props {
  attribute: RefModelAttribute
  onChange: (key: keyof RefModelAttribute, value: any) => void
}

export const RefModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attribute, onChange } = props
  const [entities, setEntities] = useState<EntityConfig<EntityModel>[]>()
  const [entityRef, setEntityRef] = useState(attribute.entity)

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntities()
      setEntities(res.items)
    })()
  }, [])

  if (!entities) {
    return <CircularProgress/>
  }

  return (
    <>
      <Grid item xs={12}>
        <FormControl className={classes.entitySelectorFormControl}>
          <InputLabel id="entity-selector">
            Entity Reference
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'entity', e.target.value as string, setEntityRef)}
            value={entityRef}
            labelId="entity-selector"
            id="entity-selector"
            fullWidth>
            {
              entities.map(entity => <MenuItem value={entity.entityName}>{capitalize(entity.entityName)}</MenuItem>)
            }
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>
    </>
  )
}
