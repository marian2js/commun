import React, { useState } from 'react'
import { EnumModelAttribute } from '@commun/core'
import { FormControl, Grid, InputLabel, makeStyles, MenuItem, Select, TextField } from '@material-ui/core'
import { TextDivider } from '../TextDivider'

const useStyles = makeStyles(theme => ({
  typeSelectorFormControl: {
    margin: theme.spacing(1),
    width: '100%',
  },
}))

type EnumType = 'boolean' | 'string' | 'number'

interface Props {
  attribute: EnumModelAttribute
  onChange: (key: keyof EnumModelAttribute, value: any) => void
}

export const EnumModelAttributeForm = (props: Props) => {
  const classes = useStyles()
  const { attribute, onChange } = props
  const [values, setValues] = useState([...(attribute.values || []), ''])
  const [types, setTypes] = useState<EnumType[]>([...(attribute.values || []).map(value => typeof value as EnumType), 'string'])

  const sendOnChange = (index: number) => {
    switch (types[index]) {
      case 'boolean':
        values[index] = values[index] === true || values[index] === 'true'
        break
      case 'number':
        values[index] = Number(values[index])
        break
      case 'string':
        values[index] = (values[index] || '').toString()
        break
    }
    setValues([...values])
    onChange('values', values.filter(value => value !== ''))
  }

  const handleValueChange = (index: number, value: string) => {
    if (value === '') {
      values.splice(index, 1)
      types.splice(index, 1)
    } else {
      values[index] = value
    }

    if (values[values.length - 1] !== '') {
      values.push('')
      types.push('string')
    }

    setValues([...values])
    setTypes([...types])
    sendOnChange(index)
  }

  const handleTypeChange = (index: number, type: EnumType) => {
    types[index] = type
    setTypes([...types])
    sendOnChange(index)
  }

  return (
    <>
      <Grid item xs={12}>
        <TextDivider><span>List of accepted values</span></TextDivider>
        {
          values.map((value, index) => (
            <Grid container>
              <Grid item xs={6}>
                {
                  ['string', 'number'].includes(types[index]) ?
                    <TextField
                      key={index}
                      onChange={e => handleValueChange(index, e.target.value)}
                      value={value}
                      name="default"
                      type={types[index] === 'number' ? 'number' : 'string'}
                      variant="outlined"
                      margin="normal"
                      fullWidth/> :
                    <FormControl className={classes.typeSelectorFormControl}>
                      <InputLabel id={`value-${index}-selector`}>
                        Value
                      </InputLabel>
                      <Select
                        onChange={e => handleValueChange(index, e.target.value as string)}
                        value={value}
                        labelId={`value-${index}-selector`}
                        id={`value-${index}-selector`}
                        fullWidth>
                        <MenuItem value="true">True</MenuItem>
                        <MenuItem value="false">False</MenuItem>
                      </Select>
                    </FormControl>
                }
              </Grid>
              <Grid item xs={6}>
                <FormControl className={classes.typeSelectorFormControl}>
                  <InputLabel id={`value-${index}-type-selector`}>
                    Type
                  </InputLabel>
                  <Select
                    onChange={e => handleTypeChange(index, e.target.value as EnumType)}
                    value={types[index]}
                    labelId={`value-${index}-type-selector`}
                    id={`value-${index}-type-selector`}
                    fullWidth>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="string">String</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          ))
        }
      </Grid>

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>
    </>
  )
}
