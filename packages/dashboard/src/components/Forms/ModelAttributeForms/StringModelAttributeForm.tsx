import React, { useState } from 'react'
import { StringModelAttribute } from '@commun/core'
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
import { TextDivider } from '../../TextDivider'
import { handleNumberAttrChange } from '../../../utils/attributes'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

const useStyles = makeStyles(theme => ({
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

export const StringModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attribute, subAttribute, onChange } = props
  const [maxLength, setMaxLength] = useState(attribute.maxLength)
  const [hashChecked, setHashChecked] = useState(!!attribute.hash)
  const [hashAlgorithm, setHashAlgorithm] = useState(attribute.hash?.algorithm)
  const [hashRounds, setHashRounds] = useState(attribute.hash && (attribute.hash.salt_rounds || DEFAULT_HASH_SALT_ROUNDS))

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
          name="default"
          type="number"
          variant="outlined"
          margin="normal"
          fullWidth
          label="Max Length"/>
      </Grid>

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

      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange} noDivider={true}/>
    </>
  )
}
