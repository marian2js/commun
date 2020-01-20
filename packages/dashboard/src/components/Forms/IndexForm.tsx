import React, { useState } from 'react'
import { EntityConfig, EntityIndex, EntityModel } from '@commun/core'
import {
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
import { AttributeSelector } from './Selectors/AttributeSelector'
import DeleteIcon from '@material-ui/icons/Delete'
import { handleAttrChange } from '../../utils/attributes'

const useStyles = makeStyles(theme => ({
  keySelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
  directionSelectorFormControl: {
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
  const { entity, index, onChange } = props
  const [keys, setKeys] = useState({ ...(index?.keys || {}), '': undefined })
  const [name, setName] = useState(index?.name)
  const [unique, setUnique] = useState(index?.unique)
  const [sparse, setSparse] = useState(index?.sparse)

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

  const handleIndexKeyDirectionChange = (key: string, value: number) => {
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
    onChange('keys', { ...newKeys, '': undefined })
    setKeys(newKeys)
  }

  return (
    <Grid container>
      <InputLabel id="dir-selector">
        Index keys
      </InputLabel>
      {
        Object.entries(keys).map(([key, direction]) => (
          <Grid container key={key}>
            <Grid item xs={6}>
              <AttributeSelector value={key}
                                 label="Key"
                                 entity={entity}
                                 onChange={newKey => handleIndexKeyChange(key, newKey)}
                                 className={classes.keySelectorFormControl}/>
            </Grid>
            <Grid item xs={5}>
              <FormControl className={classes.directionSelectorFormControl}>
                <InputLabel id="dir-selector">
                  Direction
                </InputLabel>
                <Select
                  onChange={e => handleIndexKeyDirectionChange(key, e.target.value as number)}
                  value={direction}
                  labelId="dir-selector"
                  id="dir-selector"
                  fullWidth>
                  <MenuItem value={1}>Ascending</MenuItem>
                  <MenuItem value={-1}>Descending</MenuItem>
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
