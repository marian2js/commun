import React, { useState } from 'react'
import { StringModelAttribute } from '@commun/core'
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
import { TextDivider } from '../../TextDivider'
import { handleAttrChange, handleNumberAttrChange } from '../../../utils/attributes'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

const useStyles = makeStyles(theme => ({
  validRegexFormControl: {
    margin: theme.spacing(2, 0, 1),
    width: '100%',
  },
  hashAlgorithmSelectorFormControl: {
    width: '100%',
  },
}))

interface Props {
  attribute: StringModelAttribute
  subAttribute: boolean
  onChange: (key: keyof StringModelAttribute, value: any) => void
}

const DEFAULT_HASH_ALGORITHM = 'bcrypt'
const DEFAULT_HASH_SALT_ROUNDS = 12

const REGEX_OPTIONS = [{
  name: 'Letters',
  regex: '^[a-zA-Z]*$',
}, {
  name: 'Numbers',
  regex: '^[0-9]*$',
}, {
  name: 'Alphanumeric',
  regex: '^[a-zA-Z0-9]*$',
}]

export const StringModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attribute, subAttribute, onChange } = props
  const [maxLength, setMaxLength] = useState(attribute.maxLength)
  const [validRegex, setValidRegex] = useState<string | undefined>(attribute.validRegex || '')
  const [validRegexSelector, setValidRegexSelector] = useState(
    REGEX_OPTIONS.find(o => o.regex === attribute.validRegex)?.regex || (attribute.validRegex ? 'custom' : 'all')
  )
  const [hashChecked, setHashChecked] = useState(!!attribute.hash)
  const [hashAlgorithm, setHashAlgorithm] = useState(attribute.hash?.algorithm)
  const [hashRounds, setHashRounds] = useState(attribute.hash && (attribute.hash.salt_rounds || DEFAULT_HASH_SALT_ROUNDS))

  const handleValidRegexSelectorChange = (value: string) => {
    setValidRegexSelector(value)
    if (value !== 'custom') {
      handleAttrChange<StringModelAttribute, string | undefined>(
        onChange,
        'validRegex',
        value === 'all' ? undefined : value,
        setValidRegex
      )
    }
  }

  const handleHashSelectChange = () => {
    if (hashChecked) {
      setHashChecked(false)
      setHashAlgorithm(undefined)
      setHashRounds(undefined)
      onChange('hash', undefined)
    } else {
      setHashChecked(true)
      setHashAlgorithm(DEFAULT_HASH_ALGORITHM)
      setHashRounds(DEFAULT_HASH_SALT_ROUNDS)
      onChange('hash', { algorithm: DEFAULT_HASH_ALGORITHM, salt_rounds: DEFAULT_HASH_SALT_ROUNDS })
    }
  }

  const handleHashRoundsChange = (valueStr: string) => {
    const value = valueStr ? Number(valueStr) : undefined
    setHashRounds(value)
    onChange('hash', { algorithm: hashAlgorithm, salt_rounds: value })
  }

  return (
    <>
      <Grid item xs={12}>
        <TextField
          onChange={e => handleNumberAttrChange(onChange, 'maxLength', e.target.value as string, setMaxLength)}
          value={maxLength}
          name="maxLength"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Max Length"/>
      </Grid>

      <Grid item xs={12}>
        <FormControl className={classes.validRegexFormControl}>
          <InputLabel id="validRegex-selector">
            Valid characters
          </InputLabel>
          <Select
            onChange={e => handleValidRegexSelectorChange(e.target.value as string)}
            value={validRegexSelector}
            labelId="validRegex-selector"
            id="validRegex-selector"
            fullWidth>
            <MenuItem value="all">All</MenuItem>
            {
              REGEX_OPTIONS.map(item => <MenuItem key={item.name} value={item.regex}>{item.name}</MenuItem>)
            }
            <MenuItem value="custom">Custom regular expression</MenuItem>
          </Select>
          <FormHelperText>Which characters will be accepted on this attributes</FormHelperText>
        </FormControl>
      </Grid>

      {
        validRegexSelector === 'custom' && (
          <Grid item xs={12}>
            <TextField
              onChange={e => handleAttrChange(onChange, 'validRegex', e.target.value as string, setValidRegex)}
              value={validRegex}
              name="customRegex"
              variant="outlined"
              margin="normal"
              fullWidth
              label="Custom Regex"/>
          </Grid>
        )
      }

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={hashChecked} onChange={handleHashSelectChange}/>}
              label="Hash"/>
          </FormGroup>
        </FormControl>
      </Grid>

      {
        hashChecked ?
          <>
            <Grid item xs={12}>
              <FormControl className={classes.hashAlgorithmSelectorFormControl}>
                <InputLabel id="hash-algorithm-selector">
                  Hash Algorithm
                </InputLabel>
                <Select
                  labelId="hash-algorithm-selector"
                  id="hash-algorithm-selector"
                  value={hashAlgorithm}
                  fullWidth>
                  <MenuItem value="bcrypt">Bcrypt</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                onChange={e => handleHashRoundsChange(e.target.value)}
                value={hashRounds}
                type="number"
                name="default"
                variant="outlined"
                margin="normal"
                fullWidth
                label="Hash Salt Rounds"/>
            </Grid>
          </> : ''
      }

      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}
                                          noDivider={true}/>
    </>
  )
}
