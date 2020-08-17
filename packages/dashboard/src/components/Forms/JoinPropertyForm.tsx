import {
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, JoinProperty, JoinPropertyQuery } from '@commun/core'
import { EntityService } from '../../services/EntityService'
import { handleAttrChange } from '../../utils/properties'
import { EntitySelector } from './Selectors/EntitySelector'
import { PropertySelector } from './Selectors/PropertySelector'
import DeleteIcon from '@material-ui/icons/Delete'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
  propertySelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
  query: {
    margin: theme.spacing(3, 0, 0, 0),
  },
  deleteButton: {
    margin: theme.spacing(4, 0, 0, 2),
    cursor: 'pointer',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  joinProperty?: JoinProperty
  onChange: (key: keyof JoinProperty, value: any) => void
  onKeyChange: (key: string) => void
}

export const JoinPropertyForm = (props: Props) => {
  const classes = useStyles()
  const { joinProperty, onChange, onKeyChange } = props
  const [type, setType] = useState(joinProperty?.type || '')
  const [joinPropertyKey, setJoinPropertyKey] = useState('')
  const [joinPropertyData, setJoinPropertyData] = useState<Partial<JoinProperty>>(joinProperty || {})
  const [entities, setEntities] = useState<EntityConfig<EntityModel>[]>()
  const [entityProperty, setEntityProperty] = useState(joinProperty?.entity || '')
  const [query, setQuery] = useState<JoinPropertyQuery>({ ...(joinProperty?.query || {}), '': '' })
  const [selectedEntity, setSelectedEntity] = useState<EntityConfig<EntityModel> | undefined>()

  const propertyIsNew = !joinProperty

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntities()
      setEntities(res.items)
      setSelectedEntity(res.items.find(entity => entity.entityName === entityProperty))
    })()
  }, [entityProperty])

  if (!entities) {
    return <CircularProgress/>
  }

  const handleNewPropertyKeyChange = (key: string) => {
    setJoinPropertyKey(key)
    onKeyChange(key)
  }

  const handleTypeChange = (type: Extract<JoinProperty, 'type'>) => {
    setJoinPropertyData({
      type,
      ...(joinPropertyData || {})
    })
    handleAttrChange(onChange, 'type', type, setType)
  }

  const handleEntityChange = (entityName: string) => {
    handleAttrChange(onChange, 'entity', entityName, setEntityProperty)
    setSelectedEntity(entities.find(entity => entity.entityName === entityName))
  }

  const handleQueryValueChange = (key: string, value: string) => {
    const newQuery = {
      ...query,
      [key]: value,
    }
    onChange('query', { ...newQuery, '': undefined })
    setQuery(newQuery)
  }

  const handleQueryKeyChange = (oldKey: string, newKey: string) => {
    const newQuery = {
      ...query,
      [newKey]: oldKey,
    }
    onChange('query', { ...newQuery, '': undefined })
    delete newQuery[oldKey]
    newQuery[''] = newQuery[''] || ''
    setQuery(newQuery)
  }

  const handleQueryDeleteClick = (key: string) => {
    const newQuery = { ...query }
    delete newQuery[key]
    onChange('query', { ...newQuery, '': undefined })
    setQuery(newQuery)
  }

  return (
    <Grid container>
      {
        propertyIsNew ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleNewPropertyKeyChange(e.target.value as string)}
              value={joinPropertyKey}
              name="propertyKey"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              label="Join Property Key"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="type-selector">
            Type
          </InputLabel>
          <Select
            onChange={e => handleTypeChange(e.target.value as Extract<JoinProperty, 'type'>)}
            labelId="type-selector"
            id="type-selector"
            value={type}
            required
            fullWidth>
            <MenuItem value="findOne">Find One</MenuItem>
            <MenuItem value="findMany">Find Many</MenuItem>
          </Select>
          <FormHelperText></FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <EntitySelector entities={entities} value={entityProperty} onChange={handleEntityChange}/>
      </Grid>

      {
        selectedEntity ?
          <Grid item xs={12} className={classes.query}>
            <InputLabel id="property-selector">
              Query
            </InputLabel>
            {
              Object.entries(query).map(([key, value]) => (
                <Grid container key={key}>
                  <Grid item xs={6}>
                    <PropertySelector value={key}
                                      label="Key"
                                      entity={selectedEntity}
                                      onChange={newKey => handleQueryKeyChange(key, newKey)}
                                      className={classes.propertySelectorFormControl}/>
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      onChange={e => handleQueryValueChange(key, e.target.value as string)}
                      value={value}
                      name="value"
                      variant="outlined"
                      margin="normal"
                      fullWidth
                      required
                      label="Value"/>
                  </Grid>
                  <Grid item xs={1}>
                    {
                      key === '' ? '' :
                        <div onClick={() => handleQueryDeleteClick(key)} className={classes.deleteButton}>
                          <DeleteIcon/>
                        </div>
                    }
                  </Grid>
                </Grid>
              ))
            }
          </Grid> : ''
      }
    </Grid>
  )
}
