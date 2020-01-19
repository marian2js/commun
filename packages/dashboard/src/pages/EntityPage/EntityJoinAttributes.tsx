import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, JoinAttribute } from '@commun/core'
import { JoinAttributeDialog } from '../../components/Dialogs/JoinAttributeDialog'
import { EntityService } from '../../services/EntityService'
import { SelectTable } from '../../components/Table/SelectTable'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityJoinAttributes = (props: Props) => {
  const { entity } = props
  const [joinAttributes, setJoinAttributes] = useState(entity.joinAttributes || {})
  const [selected, setSelected] = useState<string>('')
  const [attributeDialogOpen, setAttributeDialogOpen] = useState<boolean>(false)

  useEffect(() => setJoinAttributes(entity.joinAttributes || {}), [entity])

  const handleAddClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    const res = await EntityService.deleteEntityJoinAttribute(entity.entityName, selected)
    setJoinAttributes(res.item.joinAttributes || {})
    setSelected('')
  }

  const handleJoinAttributesChange = (attributeKey: string, joinAttribute: JoinAttribute) => {
    joinAttributes[attributeKey] = joinAttribute
    setJoinAttributes(joinAttributes)
    setAttributeDialogOpen(false)
  }

  const tableHeaderKeys = [{
    key: 'key',
    label: 'Key'
  }, {
    key: 'type',
    label: 'Type'
  }]

  const tableAttributes = Object.entries(joinAttributes)
    .map(([key, attribute]) => ({
      key: key,
      type: `${attribute.type} on ${attribute.entity}`
    }))

  return (
    <>
      <JoinAttributeDialog
        entity={entity}
        attributeKey={selected || undefined}
        joinAttribute={selected ? joinAttributes[selected] : undefined}
        open={attributeDialogOpen}
        onChange={handleJoinAttributesChange}
        onCancel={() => setAttributeDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   items={tableAttributes}
                   addButtonLabel="Add Join Attribute"
                   onSelectChange={item => setSelected(item?.key?.toString() || '')}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}/>

    </>
  )
}
