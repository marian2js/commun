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
import React, { useState } from 'react'
import { ModelAttribute, StringModelAttribute } from '@commun/core'
import { StringModelAttributeForm } from './StringModelAttributeForm'
import { handleAttrChange } from '../../utils/attributes'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
}))

interface Props {
  attributeKey: string
  attribute: ModelAttribute
  onChange: (key: keyof StringModelAttribute, value: any) => void
}

export const ModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attributeKey, attribute, onChange } = props
  const [type, setType] = useState<string>(attribute.type)
  const [required, setRequired] = useState(attribute.required)
  const [unique, setUnique] = useState(attribute.unique)
  const [attributeDefault, setAttributeDefault] = useState(attribute.default)
  const [index, setIndex] = useState(attribute.index)
  const [readonly, setReadonly] = useState(attribute.readonly)

  let attributeTypeForm
  switch (attribute.type) {
    case 'string':
      attributeTypeForm = <StringModelAttributeForm attribute={attribute} onChange={props.onChange}/>
  }

  return (
    <Grid container>

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="type-selector">
            Type
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'type', e.target.value as string, setType)}
            labelId="type-selector"
            id="type-selector"
            value={type}
            fullWidth>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="enum">Enum</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="ref">Ref</MenuItem>
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
                          onChange={() => handleAttrChange<boolean | undefined>(onChange, 'required', !required, setRequired)}/>
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
                          onChange={() => handleAttrChange<boolean | undefined>(onChange, 'unique', !unique, setUnique)}/>
              }
              label="Unique"/>
          </FormGroup>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          onChange={e => handleAttrChange(onChange, 'default', e.target.value, setAttributeDefault)}
          value={attributeDefault}
          name="default"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Default"/>
      </Grid>

      {attributeTypeForm || ''}

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={index}
                          onChange={() => handleAttrChange<boolean | undefined>(onChange, 'index', !index, setIndex)}/>
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
                          onChange={() => handleAttrChange<boolean | undefined>(onChange, 'readonly', !readonly, setReadonly)}/>
              }
              label="Read only"/>
          </FormGroup>
        </FormControl>
      </Grid>
    </Grid>
  )
}
