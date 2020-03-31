import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel, LifecycleEntityHooks } from '@commun/core'
import { SelectTable } from '../../components/Table/SelectTable'
import { HookDialog } from '../../components/Dialogs/HookDialog'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityHooks = (props: Props) => {
  const { entity } = props
  const [hooks, setHooks] = useState<LifecycleEntityHooks>(entity.hooks || {})
  const [selected, setSelected] = useState<{ lifecycle: keyof LifecycleEntityHooks, index: number } | null>(null)
  const [attributeDialogOpen, setAttributeDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    setHooks(entity.hooks || {})
    setSelected(null)
    setAttributeDialogOpen(false)
  }, [entity])

  const handleAddClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleDeleteClicked = async () => {
    if (!selected) {
      return
    }
    const newHooks = { ...(hooks || {}) }
    newHooks[selected.lifecycle]!.splice(selected.index, 1)
    const res = await EntityService.updateEntity(entity.entityName, { hooks: newHooks })
    entity.hooks = res.item.hooks
    setHooks(res.item.hooks || {})
    setSelected(null)
  }

  const handleHookChange = (hooks: LifecycleEntityHooks) => {
    setHooks(hooks)
    setAttributeDialogOpen(false)
    entity.hooks = hooks
  }

  const tableHeaderKeys = [{
    key: 'type',
    label: 'Type'
  }, {
    key: 'action',
    label: 'Action'
  }]

  const tableAttributes = []
  for (const [lifecycleKey, lifecycleHooks] of Object.entries(hooks)) {
    tableAttributes.push(...(lifecycleHooks || []).map((hook, index) => ({
      index,
      type: lifecycleKey,
      action: hook.action,
    })))
  }

  return (
    <>
      <HookDialog
        entity={entity}
        hook={selected ? hooks[selected.lifecycle]![selected.index] : undefined}
        lifecycle={selected?.lifecycle}
        lifecycleIndex={selected?.index}
        open={attributeDialogOpen}
        onChange={handleHookChange}
        onCancel={() => setAttributeDialogOpen(false)}/>

      <SelectTable headerKeys={tableHeaderKeys}
                   entity={entity}
                   items={tableAttributes}
                   addButtonLabel="Add Hook"
                   onSelectChange={item => setSelected(item ? {
                     lifecycle: item.type as keyof LifecycleEntityHooks,
                     index: item.index as number,
                   } : null)}
                   onAddClick={handleAddClicked}
                   onUpdateClick={handleUpdateClicked}
                   onDeleteClick={handleDeleteClicked}
      />
    </>
  )
}
