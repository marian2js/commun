import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityHook, EntityHookCondition, EntityModel, LifecycleEntityHooks } from '@commun/core'
import {
  Checkbox,
  CircularProgress,
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
import { handleAttrChange } from '../../utils/attributes'
import { EntityService } from '../../services/EntityService'

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
  hook?: EntityHook
  lifecycle?: keyof LifecycleEntityHooks
  onChange: (key: keyof EntityHook, value: any) => void
  onLifecycleChange: (lifecycle: keyof LifecycleEntityHooks) => void
}

export const HookForm = (props: Props) => {
  const classes = useStyles()
  const { entity, hook, onChange, onLifecycleChange } = props
  const [entities, setEntities] = useState<EntityConfig<EntityModel>[] | undefined>()
  const [lifecycle, setLifecycle] = useState<keyof LifecycleEntityHooks | undefined>(props.lifecycle)
  const [action, setAction] = useState(hook?.action)
  const [value, setValue] = useState(hook?.value)
  const [target, setTarget] = useState(hook?.target)
  const [condition, setCondition] = useState(hook?.condition)
  const [hasCondition, setHasCondition] = useState(!!hook?.condition)

  useEffect(() => {
    (async () => {
      const res = await EntityService.getEntities()
      setEntities(res.items)
    })()
  }, [])

  useEffect(() => {
    setLifecycle(props.lifecycle)
    setAction(hook?.action)
    setValue(hook?.value)
    setTarget(hook?.target)
    setCondition(hook?.condition)
    setHasCondition(!!hook?.condition)
  }, [hook, props.lifecycle])

  if (!entities) {
    return <CircularProgress/>
  }

  const handleLifecycleChange = (newLifecycle: keyof LifecycleEntityHooks) => {
    setLifecycle(newLifecycle)
    onLifecycleChange(newLifecycle)
  }

  const handleConditionCheck = () => {
    let newCondition: EntityHookCondition | undefined
    if (hasCondition) {
      newCondition = undefined
    } else {
      newCondition = {
        left: '',
        right: '',
        comparator: '=',
      }
    }
    setHasCondition(!hasCondition)
    setCondition(newCondition)
    onChange('condition', newCondition)
  }

  const handleConditionChange = (key: keyof EntityHookCondition, value: string) => {
    const newCondition = {
      ...condition!,
      [key]: parseExpression(value),
    }
    setCondition(newCondition)
    onChange('condition', newCondition)
  }

  const getComparatorName = () => {
    switch (condition?.comparator) {
      case '=':
        return 'equal to'
      case '>':
        return 'greater than'
      case '<':
        return 'less than'
      case '>=':
        return 'greater or equal than'
      case '<=':
        return 'less or equal than'
      case '!=':
        return 'different to'
    }
  }

  const parseExpression = (value: string) => {
    if (Number.isNaN(Number(value))) {
      return value
    }
    return Number(value)
  }

  const targets: string[] = []
  for (const [attributeKey, attribute] of Object.entries(entity.attributes)) {
    if (!attribute) {
      continue
    }
    let expandEntity: string | null = null
    if (attribute.type === 'ref') {
      expandEntity = attribute.entity
    } else if (attribute.type === 'user') {
      expandEntity = 'users'
    }

    if (expandEntity) {
      const entity = entities.find(entity => entity.entityName === expandEntity)
      if (entity) {
        for (const entityAttribute of Object.keys(entity.attributes)) {
          targets.push(`this.${attributeKey}.${entityAttribute}`)
        }
      }
    } else {
      targets.push(`this.${attributeKey}`)
    }
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="lifecycle-selector">
            Lifecycle
          </InputLabel>
          <Select
            onChange={e => handleLifecycleChange(e.target.value as keyof LifecycleEntityHooks)}
            labelId="lifecycle-selector"
            id="lifecycle-selector"
            value={lifecycle}
            required
            fullWidth>
            <MenuItem value="beforeGet">Before Get</MenuItem>
            <MenuItem value="afterGet">After Get</MenuItem>
            <MenuItem value="beforeCreate">Before Create</MenuItem>
            <MenuItem value="afterCreate">After Create</MenuItem>
            <MenuItem value="beforeUpdate">Before Update</MenuItem>
            <MenuItem value="afterUpdate">After Update</MenuItem>
            <MenuItem value="beforeDelete">Before Delete</MenuItem>
            <MenuItem value="afterDelete">After Delete</MenuItem>
          </Select>
          <FormHelperText>Event that will trigger this hook</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="action-selector">
            Action
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'action', e.target.value as EntityHook['action'], setAction)}
            labelId="action-selector"
            id="action-selector"
            value={action}
            required
            fullWidth>
            <MenuItem value="increment">Increment</MenuItem>
            <MenuItem value="set">Set</MenuItem>
          </Select>
          <FormHelperText>Action to execute on the target field</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl className={classes.typeSelectorFormControl}>
          <InputLabel id="target-selector">
            Target
          </InputLabel>
          <Select
            onChange={e => handleAttrChange(onChange, 'target', e.target.value as string, setTarget)}
            labelId="target-selector"
            id="target-selector"
            value={target}
            required
            fullWidth>
            {
              targets.map(target => <MenuItem key={target} value={target}>{target}</MenuItem>)
            }
          </Select>
          <FormHelperText></FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          onChange={e => handleAttrChange(onChange, 'value', parseExpression(e.target.value as string), setValue)}
          value={value}
          name="value"
          variant="outlined"
          margin="normal"
          fullWidth
          required
          label={action === 'increment' ? 'Increment by' : 'Set value to'}
          helperText={'Supports constants or expressions like {this.value} + 3'}/>
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={hasCondition} onChange={handleConditionCheck}/>}
              label="Run only on a certain condition"/>
          </FormGroup>
        </FormControl>
      </Grid>

      {
        hasCondition ?
          <>
            <Grid item xs={12}>
              <TextField
                onChange={e => handleConditionChange('left', e.target.value as string)}
                value={condition!.left}
                name="left"
                variant="outlined"
                margin="normal"
                fullWidth
                required
                label="Left value"
                helperText="Supports constants or expressions like {this.value} + 3"/>
            </Grid>
            <Grid item xs={12}>
              <FormControl className={classes.typeSelectorFormControl}>
                <InputLabel id="comparator-selector">
                  Comparator
                </InputLabel>
                <Select
                  onChange={e => handleConditionChange('comparator', e.target.value as EntityHookCondition['comparator'])}
                  labelId="comparator-selector"
                  id="comparator-selector"
                  value={condition!.comparator}
                  required
                  fullWidth>
                  <MenuItem value="=">=</MenuItem>
                  <MenuItem value=">">></MenuItem>
                  <MenuItem value="<">&lt;</MenuItem>
                  <MenuItem value=">=">>=</MenuItem>
                  <MenuItem value="<=">&lt;=</MenuItem>
                  <MenuItem value="!=">!=</MenuItem>
                </Select>
                <FormHelperText>
                  The hook will only run if the left value is {getComparatorName()} the right value
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                onChange={e => handleConditionChange('right', e.target.value as string)}
                value={condition!.right}
                name="right"
                variant="outlined"
                margin="normal"
                fullWidth
                required
                label="Right value"
                helperText="Supports constants or expressions like {this.value} + 3"/>
              <FormHelperText>
              </FormHelperText>
            </Grid>
          </>
          : ''
      }
    </Grid>
  )
}
