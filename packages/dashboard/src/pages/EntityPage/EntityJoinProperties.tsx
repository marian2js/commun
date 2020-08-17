import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, JoinProperty } from '@commun/core'
import { JoinPropertyDialog } from '../../components/Dialogs/JoinPropertyDialog'
import { EntityService } from '../../services/EntityService'
import { SelectTable } from '../../components/Table/SelectTable'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityJoinProperties = (props: Props) => {
  const { entity } = props
  const [joinProperties, setJoinProperties] = useState(entity.joinProperties || {})
  const [selected, setSelected] = useState<string>('')
  const [propertyDialogOpen, setPropertyDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    setJoinProperties(entity.joinProperties || {})
    setSelected('')
    setPropertyDialogOpen(false)
  }, [entity])

  const handleAddClicked = () => {
    setPropertyDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setPropertyDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    const res = await EntityService.deleteEntityJoinProperty(entity.entityName, selected)
    setJoinProperties(res.item.joinProperties || {})
    setSelected('')
  }

  const handleJoinPropertiesChange = (propertyKey: string, joinProperty: JoinProperty) => {
    joinProperties[propertyKey] = joinProperty
    setJoinProperties(joinProperties)
    setPropertyDialogOpen(false)
  }

  const tableHeaderKeys = [{
    key: 'key',
    label: 'Key'
  }, {
    key: 'type',
    label: 'Type'
  }]

  const tableProperties = Object.entries(joinProperties)
    .map(([key, property]) => ({
      key: key,
      type: `${property.type} on ${property.entity}`
    }))

  return (
    <>
      <JoinPropertyDialog
        entity={entity}
        propertyKey={selected || undefined}
        joinProperty={selected ? joinProperties[selected] : undefined}
        open={propertyDialogOpen}
        onChange={handleJoinPropertiesChange}
        onCancel={() => setPropertyDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   entity={entity}
                   items={tableProperties}
                   addButtonLabel="Add Join Property"
                   onSelectChange={item => setSelected(item?.key?.toString() || '')}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}/>

    </>
  )
}
