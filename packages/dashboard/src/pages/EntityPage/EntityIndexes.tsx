import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityIndex, EntityModel } from '@commun/core'
import { SelectTable } from '../../components/Table/SelectTable'
import { IndexDialog } from '../../components/Dialogs/IndexDialog'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityIndexes = (props: Props) => {
  const { entity } = props
  const [indexes, setIndexes] = useState(entity.indexes || [])
  const [selected, setSelected] = useState<number | null>(null)
  const [indexDialogOpen, setIndexDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    setIndexes(entity.indexes || [])
    setSelected(null)
    setIndexDialogOpen(false)
  }, [entity])

  const handleAddClicked = () => {
    setIndexDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setIndexDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    entity.indexes!.splice(selected!, 1)
    const res = await EntityService.updateEntity(entity.entityName, { indexes: entity.indexes })
    setIndexes(res.item.indexes || [])
    setSelected(null)
  }

  const handleIndexesChange = (indexes: EntityIndex<EntityModel>[]) => {
    setIndexes(indexes)
    setIndexDialogOpen(false)
  }

  const tableHeaderKeys = [{
    key: 'keys',
    label: 'Keys'
  }, {
    key: 'type',
    label: 'Type'
  }]

  const tableAttributes = indexes.map((index, i) => ({
    position: i,
    accessTokenKeys: Object.keys(index.keys).join(', '),
    type: `${index.unique ? 'Unique' : ''} ${index.sparse ? 'Sparse' : ''}`,
  }))

  return (
    <>
      <IndexDialog
        entity={entity}
        index={selected !== null ? indexes[selected] : undefined}
        indexPosition={selected === null ? undefined : selected}
        open={indexDialogOpen}
        onChange={handleIndexesChange}
        onCancel={() => setIndexDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   items={tableAttributes}
                   addButtonLabel="Add Index"
                   onSelectChange={item => setSelected(item ? Number(item.position) : null)}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}
      />
    </>
  )
}
