import React, { useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import { EntityConfig, EntityHook, EntityModel, LifecycleEntityHooks } from '@commun/core'
import { HookForm } from '../Forms/HookForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
  hook?: EntityHook
  lifecycle?: keyof LifecycleEntityHooks
  lifecycleIndex?: number
  open: boolean
  onChange: (hooks: LifecycleEntityHooks) => void
  onCancel: () => void
}

export const HookDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, hook, lifecycle, lifecycleIndex, open, onCancel, onChange } = props
  const [hookData, setHookData] = useState<Partial<EntityHook> | undefined>(hook)
  const [newLifecycle, setNewLifecycle] = useState<keyof LifecycleEntityHooks | undefined>()

  useEffect(() => setHookData(hook), [hook])

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const hookIsNew = !hook

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!newLifecycle) {
      return
    }
    const newHooks = { ...(entity.hooks || {}) }
    const hook = hookData as EntityHook
    if (!newHooks[newLifecycle]) {
      newHooks[newLifecycle] = []
    }
    newHooks[newLifecycle]!.push(hook)
    const res = await EntityService.updateEntity(entity.entityName, { hooks: newHooks })
    onChange(res.item.hooks || {})
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!lifecycle || lifecycleIndex === undefined) {
      return
    }
    const newHooks = { ...(entity.hooks || {}) }
    const hook = hookData as EntityHook

    if (!newHooks[lifecycle]) {
      newHooks[lifecycle] = []
    }

    // newLifecycle is defined only if the hook lifecycle was changed
    if (newLifecycle) {
      if (!newHooks[newLifecycle]) {
        newHooks[newLifecycle] = []
      }
      newHooks[lifecycle]!.splice(lifecycleIndex, 1)
      newHooks[newLifecycle]!.push(hook)
    } else {
      newHooks[lifecycle]![lifecycleIndex] = hook
    }

    const res = await EntityService.updateEntity(entity.entityName, { hooks: newHooks })
    onChange(res.item.hooks || {})
  }

  const handleHookChange = (key: keyof EntityHook, value: any) => {
    if (!hookData) {
      setHookData({ [key]: value })
      return
    }
    hookData[key] = value
    setHookData(hookData)
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">
        {hookIsNew ? 'Add new hook' : `Update ${lifecycle} hook`}
      </DialogTitle>

      <DialogContent>
        <HookForm entity={entity}
                  hook={hook}
                  lifecycle={lifecycle}
                  onChange={handleHookChange}
                  onLifecycleChange={setNewLifecycle}/>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        {
          hookIsNew ?
            <Button onClick={handleAddClick} color="primary" autoFocus>
              Add hook
            </Button> :
            <Button onClick={handleUpdateClick} color="primary" autoFocus>
              Update
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
