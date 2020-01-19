import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import {
  EntityConfig,
  EntityModel,
  EnumModelAttribute,
  ModelAttribute,
  NumberModelAttribute,
  RefModelAttribute, SlugModelAttribute, StringModelAttribute
} from '@commun/core'
import { StringModelAttributeForm } from './StringModelAttributeForm'
import { handleAttrChange } from '../../utils/attributes'
import { NumberModelAttributeForm } from './NumberModelAttributeForm'
import { EnumModelAttributeForm } from './EnumModelAttributeForm'
import { RefModelAttributeForm } from './RefModelAttributeForm'
import { SlugModelAttributeForm } from './SlugModelAttributeForm'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  attribute?: ModelAttribute
  onChange: <T extends ModelAttribute>(key: keyof T, value: any) => void
  onKeyChange: (key: string) => void
}

export const ModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { entity, attribute, onChange, onKeyChange } = props
  const [type, setType] = useState(attribute?.type || '')
  const [required, setRequired] = useState(attribute?.required)
  const [unique, setUnique] = useState(attribute?.unique)
  const [attributeDefault, setAttributeDefault] = useState(attribute?.default || '')
  const [index, setIndex] = useState(attribute?.index)
  const [readonly, setReadonly] = useState(attribute?.readonly)
  const [attributeData, setAttributeData] = useState<ModelAttribute | undefined>(attribute)
  const [attributeKey, setAttributeKey] = useState('')
  const [attributeTypeForm, setAttributeTypeForm] = useState()
  const [showDefault, setShowDefault] = useState()

  const attributeIsNew = !attribute

  useEffect(() => {
    let from
    let showDefault = true
    switch (type) {
      case 'enum':
        from = <EnumModelAttributeForm attribute={attributeData as EnumModelAttribute} onChange={onChange}/>
        showDefault = false
        break
      case 'number':
        from = <NumberModelAttributeForm attribute={attributeData as NumberModelAttribute} onChange={onChange}/>
        break
      case 'ref':
        from = <RefModelAttributeForm attribute={attributeData as RefModelAttribute} onChange={onChange}/>
        showDefault = false
        break
      case 'slug':
        from = <SlugModelAttributeForm entity={entity} attribute={attributeData as SlugModelAttribute} onChange={onChange}/>
        break
      case 'string':
        from = <StringModelAttributeForm attribute={attributeData as StringModelAttribute} onChange={onChange}/>
        break
    }
    setAttributeTypeForm(from)
    setShowDefault(showDefault)
  }, [attributeData, type, entity, onChange])

  const handleNewAttributeKeyChange = (key: string) => {
    setAttributeKey(key)
    onKeyChange(key)
  }

  const handleTypeChange = (type: Extract<ModelAttribute, 'type'>) => {
    setAttributeData({
      type,
      ...(attributeData || {})
    })
    handleAttrChange(onChange, 'type', type, setType)
  }

  return (
    <Grid container>
      {
        attributeIsNew ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleNewAttributeKeyChange(e.target.value as string)}
              value={attributeKey}
              name="attributeKey"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              label="Attribute Key"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="type-selector">
            Type
          </InputLabel>
          <Select
            onChange={e => handleTypeChange(e.target.value as Extract<ModelAttribute, 'type'>)}
            labelId="type-selector"
            id="type-selector"
            value={type}
            required
            fullWidth>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="enum">Enum</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="ref">Entity Reference</MenuItem>
            <MenuItem value="slug">Slug</MenuItem>
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
          <FormHelperText></FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={required}
                          onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(onChange, 'required', !required, setRequired)}/>
              }
              label="Required"/>
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={unique}
                          onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(onChange, 'unique', !unique, setUnique)}/>
              }
              label="Unique"/>
          </FormGroup>
        </FormControl>
      </Grid>

      {
        showDefault ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handleAttrChange(onChange, 'default', e.target.value, setAttributeDefault)}
              value={attributeDefault}
              name="default"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Default"/>
          </Grid> : ''
      }

      {attributeTypeForm || ''}

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={index}
                          onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(onChange, 'index', !index, setIndex)}/>
              }
              label="Index"/>
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={readonly}
                          onChange={() => handleAttrChange<ModelAttribute, boolean | undefined>(onChange, 'readonly', !readonly, setReadonly)}/>
              }
              label="Read only"/>
          </FormGroup>
        </FormControl>
      </Grid>
    </Grid>
  )
}
