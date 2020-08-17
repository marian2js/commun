import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { EntityService } from '../../services/EntityService'
import { JSONSchema7 } from 'json-schema'
import { getPropertyEntityRef } from '../../utils/properties'
import { PropertyDialog } from '../../components/Dialogs/PropertyDialog'
import { SelectTable } from '../../components/Table/SelectTable'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntitySchema = (props: Props) => {
  const { entity } = props
  const [properties, setProperties] = useState(entity.schema.properties || {})
  const [selected, setSelected] = useState<string>('')
  const [propertyDialogOpen, setPropertyDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    setProperties(entity.schema.properties || {})
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
    await EntityService.deleteEntityProperty(entity.entityName, selected)
    delete properties[selected]
    setProperties({ ...properties })
    setSelected('')
  }

  const handlePropertiesChange = (propertyKey: string, property: JSONSchema7) => {
    properties[propertyKey as keyof EntityModel] = property
    setProperties(properties)
    setPropertyDialogOpen(false)
  }

  const getPropertyTypeLabel = (property: JSONSchema7) => {
    const refEntityName = getPropertyEntityRef(property)
    if (refEntityName) {
      return `Reference to ${capitalize(refEntityName)}`
    }
    if (property.format === 'id') {
      return 'ID'
    }
    if (property.format?.startsWith('eval:')) {
      return 'Eval expression'
    }
    if (property.format) {
      return capitalize(property.format)
    }
    return typeof property.type === 'string' ? capitalize(property.type) : ''
  }

  const tableHeaderKeys = [{
    key: 'key',
    label: 'Key'
  }, {
    key: 'type',
    label: 'Type'
  }]

  const tableProperties = Object.entries(properties)
    .sort(([key]) => key === 'id' ? -1 : 1)
    .filter(([_, property]) => typeof property !== 'boolean')
    .map(([key, property]) => ({
      key: key,
      type: getPropertyTypeLabel(property as JSONSchema7),
      noSelectable: key === 'id',
    }))

  return (
    <>
      <PropertyDialog
        entity={entity}
        propertyKey={selected || undefined}
        property={selected ? properties[selected] as JSONSchema7 : undefined}
        open={propertyDialogOpen}
        onChange={handlePropertiesChange}
        onCancel={() => setPropertyDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   items={tableProperties}
                   addButtonLabel="Add Property"
                   entity={entity}
                   onSelectChange={item => setSelected(item?.key?.toString() || '')}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}/>
    </>
  )
}
