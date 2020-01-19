import React, { useState } from 'react'
import { RefModelAttribute } from '@commun/core'
import { Grid } from '@material-ui/core'
import { TextDivider } from '../TextDivider'
import { handleAttrChange } from '../../utils/attributes'
import { EntitySelector } from './Selectors/EntitySelector'

interface Props {
  attribute: RefModelAttribute
  onChange: (key: keyof RefModelAttribute, value: any) => void
}

export const RefModelAttributeForm = (props: Props) => {
  const { attribute, onChange } = props
  const [entityRef, setEntityRef] = useState(attribute.entity)

  return (
    <>
      <Grid item xs={12}>
        <EntitySelector value={entityRef}
                        onChange={value => handleAttrChange(onChange, 'entity', value, setEntityRef)}/>
      </Grid>

      <Grid item xs={12}>
        <TextDivider><span>Advanced options</span></TextDivider>
      </Grid>
    </>
  )
}
