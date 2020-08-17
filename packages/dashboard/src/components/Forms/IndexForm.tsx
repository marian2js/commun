import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityIndex, EntityModel } from '@commun/core'
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core'
import { PropertySelector } from './Selectors/PropertySelector'
import DeleteIcon from '@material-ui/icons/Delete'
import { handleAttrChange } from '../../utils/properties'
import { Alert } from '@material-ui/lab'

const useStyles = makeStyles(theme => ({
  keySelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
  indexKeyTypeSelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
  deleteButton: {
    margin: theme.spacing(4, 0, 0, 2),
    cursor: 'pointer',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  index?: EntityIndex<EntityModel>
  onChange: (key: keyof EntityIndex<EntityModel>, value: any) => void
}

export const IndexForm = (props: Props) => {
  const classes = useStyles()
  const { onChange } = props
  const [entity, setEntity] = useState(props.entity)
  const [index, setIndex] = useState(props.index)
  const [keys, setKeys] = useState<{ [key: string]: number | string | undefined }>({ ...(index?.keys || {}), '': '' })
  const [name, setName] = useState(index?.name || '')
  const [unique, setUnique] = useState(index?.unique || false)
  const [sparse, setSparse] = useState(index?.sparse || false)

  useEffect(() => {
    setEntity(props.entity)
    setIndex(props.index)
  }, [props])

  const handleIndexKeyChange = (oldKey: string, newKey: string) => {
    const newIndexKeys = {
      ...keys,
      [newKey]: oldKey,
    }
    onChange('keys', { ...newIndexKeys, '': undefined })
    delete (newIndexKeys as any)[oldKey]
    newIndexKeys[''] = newIndexKeys[''] || undefined
    setKeys(newIndexKeys)
  }

  const handleIndexKeyTypeChange = (key: string, value: number) => {
    const newKeys = {
      ...keys,
      [key]: value,
    }
    setKeys(newKeys)
    onChange('keys', newKeys)
  }

  const handleIndexKeyDeleteClick = (key: string) => {
    const newKeys = { ...keys }
    delete (newKeys as any)[key]
    onChange('keys', { ...newKeys, '': '' })
    setKeys(newKeys)
  }

  const getTextIndexAlert = () => {
    if (!Object.values(keys).includes('text')) {
      return
    }
    const entityTextIndex = (entity.indexes || []).find(index => Object.values(index.keys).includes('text'))
    let alert
    if (entityTextIndex && entityTextIndex !== index) {
      alert = (
        <Alert severity="error">
          There can only be one Text Index per entity, but it can contain multiple attributes.
        </Alert>
      )
    } else {
      alert = (
        <Alert severity="info">
          A Text Index enables searches in the attribute's text.
          There can only be one Text Index per entity, but it can contain multiple attributes.
        </Alert>
      )
    }
    return (
      <Box mb={2}>
        {alert}
      </Box>
    )
  }

  return (
    <Grid container>
      {
        getTextIndexAlert()
      }

      <InputLabel id="dir-selector">
        Index keys
      </InputLabel>
      {
        Object.entries(keys).map(([key, indexType]) => (
          <Grid container key={key}>
            <Grid item xs={6}>
              <PropertySelector value={key}
                                label="Key"
                                entity={entity}
                                onChange={newKey => handleIndexKeyChange(key, newKey)}
                                className={classes.keySelectorFormControl}/>
            </Grid>
            <Grid item xs={5}>
              <FormControl className={classes.indexKeyTypeSelectorFormControl}>
                <InputLabel id="key-type-selector">
                  Index type
                </InputLabel>
                <Select
                  onChange={e => handleIndexKeyTypeChange(key, e.target.value as number)}
                  value={indexType}
                  labelId="key-type-selector"
                  id="key-type-selector"
                  fullWidth>
                  <MenuItem value={1}>Ascending</MenuItem>
                  <MenuItem value={-1}>Descending</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={1}>
              {
                key === '' ? '' :
                  <div onClick={() => handleIndexKeyDeleteClick(key)} className={classes.deleteButton}>
                    <DeleteIcon/>
                  </div>
              }
            </Grid>
          </Grid>
        ))
      }

      <Grid item xs={12}>
        <TextField
          onChange={e => handleAttrChange(onChange, 'name', e.target.value as string, setName)}
          value={name}
          name="name"
          variant="outlined"
          margin="normal"
          label="Index Name"
          fullWidth/>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={unique}
                                 onChange={() => handleAttrChange(onChange, 'unique', !unique, setUnique)}/>}
              label="Unique"/>
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={sparse}
                                 onChange={() => handleAttrChange(onChange, 'sparse', !sparse, setSparse)}/>}
              label="Sparse"/>
          </FormGroup>
        </FormControl>
      </Grid>

    </Grid>
  )
}
