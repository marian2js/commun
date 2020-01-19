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
import { EntityConfig, EntityModel, JoinAttribute, JoinAttributeQuery } from '@commun/core'
import { EntityService } from '../../services/EntityService'
import { handleAttrChange } from '../../utils/attributes'
import { EntitySelector } from './Selectors/EntitySelector'
import { AttributeSelector } from './Selectors/AttributeSelector'
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
  attributeSelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
  query: {
    margin: theme.spacing(3, 0, 0, 0),
  },
  deleteButton: {
    margin: theme.spacing(4, 0, 0, 2),
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  joinAttribute?: JoinAttribute
  onChange: (key: keyof JoinAttribute, value: any) => void
  onKeyChange: (key: string) => void
}

export const JoinAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { joinAttribute, onChange, onKeyChange } = props
  const [type, setType] = useState(joinAttribute?.type || '')
  const [joinAttributeKey, setJoinAttributeKey] = useState('')
  const [joinAttributeData, setJoinAttributeData] = useState<Partial<JoinAttribute>>(joinAttribute || {})
  const [entities, setEntities] = useState<EntityConfig<EntityModel>[]>()
  const [entityAttribute, setEntityAttribute] = useState(joinAttribute?.entity || '')
  const [query, setQuery] = useState<JoinAttributeQuery>({ ...(joinAttribute?.query || {}), '': '' })
  const [selectedEntity, setSelectedEntity] = useState<EntityConfig<EntityModel> | undefined>()

  const attributeIsNew = !joinAttribute

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntities()
      setEntities(res.items)
      setSelectedEntity(res.items.find(entity => entity.entityName === entityAttribute))
    })()
  }, [entityAttribute])

  if (!entities) {
    return <CircularProgress/>
  }

  const handleNewAttributeKeyChange = (key: string) => {
    setJoinAttributeKey(key)
    onKeyChange(key)
  }

  const handleTypeChange = (type: Extract<JoinAttribute, 'type'>) => {
    setJoinAttributeData({
      type,
      ...(joinAttributeData || {})
    })
    handleAttrChange(onChange, 'type', type, setType)
  }

  const handleEntityChange = (entityName: string) => {
    handleAttrChange(onChange, 'entity', entityName, setEntityAttribute)
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

  const handleQueryDeleteClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, key: string) => {
    e.preventDefault()
    const newQuery = { ...query }
    delete newQuery[key]
    onChange('query', { ...newQuery, '': undefined })
    setQuery(newQuery)
  }

  return (
    <Grid container>
      {
        attributeIsNew ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleNewAttributeKeyChange(e.target.value as string)}
              value={joinAttributeKey}
              name="attributeKey"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              label="Join Attribute Key"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="type-selector">
            Type
          </InputLabel>
          <Select
            onChange={e => handleTypeChange(e.target.value as Extract<JoinAttribute, 'type'>)}
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
        <EntitySelector entities={entities} value={entityAttribute} onChange={handleEntityChange}/>
      </Grid>

      {
        selectedEntity ?
          <Grid item xs={12} className={classes.query}>
            <InputLabel id="attribute-selector">
              Query
            </InputLabel>
            {
              Object.entries(query).map(([key, value]) => (
                <Grid container key={key}>
                  <Grid item xs={6}>
                    <AttributeSelector value={key}
                                       label="Key"
                                       entity={selectedEntity}
                                       onChange={newKey => handleQueryKeyChange(key, newKey)}
                                       className={classes.attributeSelectorFormControl}/>
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
                        <a href="#" onClick={e => handleQueryDeleteClick(e, key)}>
                          <DeleteIcon className={classes.deleteButton} />
                        </a>
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
