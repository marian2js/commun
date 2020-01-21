import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityIndex, EntityModel } from '@commun/core'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import { IndexForm } from '../Forms/IndexForm'
import { EntityService } from '../../services/EntityService'

interface Props {
  entity: EntityConfig<EntityModel>
  index?: EntityIndex<EntityModel>
  indexPosition?: number
  open: boolean
  onChange: (indexes: EntityIndex<EntityModel>[]) => void
  onCancel: () => void
}

export const IndexDialog = (props: Props) => {
  const theme = useTheme()
  const { entity, index, open, onChange, onCancel } = props
  const [indexData, setIndexData] = useState<Partial<EntityIndex<EntityModel>> | undefined>(index)
  const [indexPosition, setIndexPosition] = useState(props.indexPosition)

  useEffect(() => {
    setIndexData(index)
    setIndexPosition(props.indexPosition)
  }, [index, props.indexPosition])

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const indexIsNew = !index

  const handleAddClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!entity.indexes) {
      entity.indexes = []
    }
    entity.indexes.push(indexData as EntityIndex<EntityModel>)
    const res = await EntityService.updateEntity(entity.entityName, { indexes: entity.indexes })
    onChange(res.item.indexes || [])
  }

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    entity.indexes![indexPosition!]! = indexData as EntityIndex<EntityModel>
    const res = await EntityService.updateEntity(entity.entityName, { indexes: entity.indexes })
    onChange(res.item.indexes || [])
  }

  const handleIndexChange = (key: keyof EntityIndex<EntityModel>, value: any) => {
    setIndexData({
      ...(indexData || {}),
      [key]: value,
    })
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onCancel}
      aria-labelledby="attribute-dialog-title">

      <DialogTitle id="attribute-dialog-title">
        {indexIsNew ? 'Add new index' : `Update "${Object.keys(index!.keys).join(', ')}" index`}
      </DialogTitle>

      <DialogContent>
        <IndexForm entity={entity}
                   index={index}
                   onChange={handleIndexChange}/>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} color="primary">
          Cancel
        </Button>
        {
          indexIsNew ?
            <Button onClick={handleAddClick} color="primary" autoFocus>
              Add index
            </Button> :
            <Button onClick={handleUpdateClick} color="primary" autoFocus>
              Update
            </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
