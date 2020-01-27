import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import { EnumModelAttributeForm } from './EnumModelAttributeForm'
import { ListModelAttributeForm } from './ListModelAttributeForm'
import { NumberModelAttributeForm } from './NumberModelAttributeForm'
import { RefModelAttributeForm } from './RefModelAttributeForm'
import { SlugModelAttributeForm } from './SlugModelAttributeForm'
import { StringModelAttributeForm } from './StringModelAttributeForm'
import { ModelAttributeSharedOptions } from './ModelAttributeSharedOptions'
import { ModelAttributeAdvanceSharedOptions } from './ModelAttributeAdvanceSharedOptions'
import { MapModelAttributeForm } from './MapModelAttributeForm'

interface Props {
  entity: EntityConfig<EntityModel>
  attribute?: ModelAttribute
  subAttribute: boolean
  onChange: <T extends ModelAttribute>(key: keyof T, value: any) => void
}

export const ModelAttributeFormSwitch = (props: Props) => {
  const { entity, subAttribute, onChange } = props
  const [attribute, setAttribute] = useState(props.attribute)

  useEffect(() => setAttribute(props.attribute), [props.attribute])

  if (!attribute) {
    return <></>
  }

  switch (attribute.type) {
    case 'enum':
      return <EnumModelAttributeForm attribute={attribute}
                                     subAttribute={subAttribute}
                                     onChange={onChange}/>
    case 'list':
      return <ListModelAttributeForm entity={entity}
                                     attribute={attribute}
                                     subAttribute={subAttribute}
                                     onChange={onChange}/>
    case 'map':
      return <MapModelAttributeForm entity={entity}
                                    attribute={attribute}
                                    subAttribute={subAttribute}
                                    onChange={onChange}/>
    case 'number':
      return <NumberModelAttributeForm attribute={attribute}
                                       subAttribute={subAttribute}
                                       onChange={onChange}/>
    case 'ref':
      return <RefModelAttributeForm attribute={attribute}
                                    subAttribute={subAttribute}
                                    onChange={onChange}/>
    case 'slug':
      return <SlugModelAttributeForm entity={entity}
                                     attribute={attribute}
                                     subAttribute={subAttribute}
                                     onChange={onChange}/>
    case 'string':
      return <StringModelAttributeForm attribute={attribute}
                                       subAttribute={subAttribute}
                                       onChange={onChange}/>
  }

  return (
    <>
      <ModelAttributeSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
      <ModelAttributeAdvanceSharedOptions attribute={attribute} subAttribute={subAttribute} onChange={onChange}/>
    </>
  )
}
