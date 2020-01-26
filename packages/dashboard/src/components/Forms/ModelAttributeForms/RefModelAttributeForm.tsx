import React, { useState } from 'react'
import { RefModelAttribute } from '@commun/core'
import { Grid } from '@material-ui/core'
import { handleAttrChange } from '../../../utils/attributes'
import { EntitySelector } from '../Selectors/EntitySelector'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'

interface Props {
  attribute: RefModelAttribute
  subAttribute: boolean
  onChange: (key: keyof RefModelAttribute, value: any) => void
}

export const RefModelAttributeForm = (props: Props) => {
  const { attribute, subAttribute, onChange } = props
  const [entityRef, setEntityRef] = useState(attribute.entity)

  return (
    <>
      <Grid item xs={12}>
        <EntitySelector value={entityRef}
                        onChange={value => handleAttrChange(onChange, 'entity', value, setEntityRef)}/>
      </Grid>

      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange} noDefault={true}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
