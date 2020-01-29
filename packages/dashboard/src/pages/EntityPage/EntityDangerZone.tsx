import React, { useEffect, useState } from 'react'
import { EntityConfig, EntityModel } from '@commun/core'
import { Button } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { DeleteEntityDialog } from '../../components/Dialogs/DeleteEntityDialog'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    deleteIcon: {
      marginRight: theme.spacing(1),
    },
  }),
)

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityDangerZone = (props: Props) => {
  const classes = useStyles()
  const { entity } = props
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setDialogOpen(false)
  }, [entity])

  const handleDeleteClick = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <DeleteEntityDialog entity={entity}
                          open={dialogOpen}
                          onCancel={() => setDialogOpen(false)}/>

      <Button onClick={handleDeleteClick} variant="contained" color="secondary">
        <DeleteIcon className={classes.deleteIcon}/>
        Delete entity
      </Button>
    </>
  )
}
