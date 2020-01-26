import React, { useState } from 'react'
import { EntityConfig, EntityModel, SlugModelAttribute } from '@commun/core'
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
import { handleAttrChange } from '../../../utils/attributes'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

const useStyles = makeStyles(theme => ({
  setFromSelectorFormControl: {
    margin: theme.spacing(2, 0),
    width: '100%',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
  attribute: SlugModelAttribute
  subAttribute: boolean
  onChange: (key: keyof SlugModelAttribute, value: any) => void
}

const DEFAULT_PREFIX_SUFFIX_CHARS = 8
const DEFAULT_PREFIX_SUFFIX_TYPE = 'random'

export const SlugModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { entity, attribute, subAttribute, onChange } = props
  const [setFrom, setSetFrom] = useState(attribute.setFrom)
  const [prefixChecked, setPrefixChecked] = useState(!!attribute.prefix)
  const [prefixChars, setPrefixChars] = useState(attribute.prefix?.chars)
  const [suffixChecked, setSuffixChecked] = useState(!!attribute.suffix)
  const [suffixChars, setSuffixChars] = useState(attribute.suffix?.chars)

  const setFromAttributes = Object.entries(entity.attributes)
    .filter(([_, value]) => ['email', 'number', 'string', 'slug'].includes(value!.type))
    .map(([key]) => key)

  const handlePrefixSuffixCheckChange = (
    type: 'prefix' | 'suffix',
    checked: boolean,
    setChecked: React.Dispatch<React.SetStateAction<boolean>>,
    setChars: React.Dispatch<React.SetStateAction<number | undefined>>,
  ) => {
    if (checked) {
      setChecked(false)
      setChars(undefined)
      onChange(type, undefined)
    } else {
      setChecked(true)
      setChars(DEFAULT_PREFIX_SUFFIX_CHARS)
      onChange(type, { type: DEFAULT_PREFIX_SUFFIX_TYPE, chars: DEFAULT_PREFIX_SUFFIX_CHARS })
    }
  }

  const handlePrefixSuffixCharsChange = (
    type: 'prefix' | 'suffix',
    valueStr: string,
    setChars: React.Dispatch<React.SetStateAction<number | undefined>>,
  ) => {
    const value = valueStr ? Number(valueStr) : undefined
    setChars(value)
    onChange(type, { type: DEFAULT_PREFIX_SUFFIX_TYPE, chars: value })
  }

  return (
    <>
      <Grid item xs={12}>
        <FormControl className={classes.setFromSelectorFormControl}>
          <InputLabel id="setFrom-selector">
            Set From
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'setFrom', e.target.value as string, setSetFrom)}
            value={setFrom}
            labelId="setFrom-selector"
            id="setFrom-selector"
            fullWidth>
            {
              setFromAttributes.map(key => <MenuItem key={key} value={key}>{key}</MenuItem>)
            }
          </Select>
          <FormHelperText>Attribute used to generate the slug</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={prefixChecked} onChange={() => {
                handlePrefixSuffixCheckChange('prefix', prefixChecked, setPrefixChecked, setPrefixChars)
              }}/>}
              label="Set random prefix"/>
          </FormGroup>
        </FormControl>
      </Grid>

      {
        prefixChecked ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handlePrefixSuffixCharsChange('prefix', e.target.value, setPrefixChars)}
              value={prefixChars}
              type="number"
              name="default"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Number of characters for random prefix"/>
          </Grid> : ''
      }

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={suffixChecked} onChange={() => {
                handlePrefixSuffixCheckChange('suffix', suffixChecked, setSuffixChecked, setSuffixChars)
              }}/>}
              label="Set random suffix"/>
          </FormGroup>
        </FormControl>
      </Grid>

      {
        suffixChecked ?
          <Grid item xs={12}>
            <TextField
              onChange={e => handlePrefixSuffixCharsChange('suffix', e.target.value, setSuffixChars)}
              value={suffixChars}
              type="number"
              name="default"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Number of characters for random suffix"/>
          </Grid> : ''
      }

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
