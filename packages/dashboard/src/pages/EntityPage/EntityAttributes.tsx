import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { AttributeDialog } from '../../components/Dialogs/AttributeDialog'
import { EntityService } from '../../services/EntityService'
import { SelectTable } from '../../components/Table/SelectTable'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityAttributes = (props: Props) => {
  const { entity } = props
  const [attributes, setAttributes] = useState(entity.attributes)
  const [selected, setSelected] = useState<string>('')
  const [attributeDialogOpen, setAttributeDialogOpen] = useState<boolean>(false)

  useEffect(() => setAttributes(entity.attributes), [entity])

  const handleAddClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    const res = await EntityService.deleteEntityAttribute(entity.entityName, selected)
    setAttributes(res.item.attributes)
    setSelected('')
  }

  const handleAttributesChange = (attributeKey: string, attribute: ModelAttribute) => {
    attributes[attributeKey as keyof EntityModel] = attribute
    setAttributes(attributes)
    setAttributeDialogOpen(false)
  }

  const getAttributeTypeLabel = (attribute: ModelAttribute) => {
    switch (attribute.type) {
      case 'id':
        return 'ID'
      case 'ref':
        return `Reference to ${capitalize(attribute.entity)}`
      case 'slug':
        return `Slug from ${attribute.setFrom}`
      default:
        return capitalize(attribute!.type)
    }
  }

  const tableHeaderKeys = [{
    key: 'key',
    label: 'Key'
  }, {
    key: 'type',
    label: 'Type'
  }]

  const tableAttributes = Object.entries(attributes)
    .sort(([key]) => key === '_id' ? -1 : 1)
    .map(([key, attribute]) => ({
      key: key,
      type: getAttributeTypeLabel(attribute!)
    }))

  return (
    <>
      <AttributeDialog
        entity={entity}
        attributeKey={selected || undefined}
        attribute={selected ? attributes[selected as keyof EntityModel] : undefined}
        open={attributeDialogOpen}
        onChange={handleAttributesChange}
        onCancel={() => setAttributeDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   items={tableAttributes}
                   addButtonLabel="Add Attribute"
                   onSelectChange={item => setSelected(item?.key?.toString() || '')}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}/>

    </>
  )
}
