import React, { useEffect, useState } from 'react'
import {
  Button,
  Grid,
  makeStyles,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core'
import { EntityConfig, EntityModel } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { UpdateAttributeDialog } from '../../components/Dialogs/UpdateAttributeDialog'

const useStyles = makeStyles(theme => ({
  form: {
    width: '100%',
  },
  table: {
    maxWidth: '100%'
  },
  updateButton: {
    marginRight: theme.spacing(2),
  },
  actionButtons: {
    float: 'right',
  },
  actionButtonsTop: {
    margin: theme.spacing(0, 0, 1, 0),
  },
  actionButtonsBottom: {
    margin: theme.spacing(3, 0, 0, 0),
  }
}))

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityAttributes = (props: Props) => {
  const classes = useStyles()
  const { entity } = props
  const [attributes, setAttributes] = useState(entity.attributes)
  const [selected, setSelected] = useState<string>('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false)

  useEffect(() => setAttributes(entity.attributes), [entity])

  const handleUpdateClicked = () => {
    setUpdateDialogOpen(true)
  }

  const handleDeleteClicked = () => {
    // TODO
  }

  const getActionButtons = (position: 'top' | 'bottom') => {
    if (!selected) {
      return ''
    }
    return (
      <Grid item xs={12}>
        <div
          className={`${classes.actionButtons} ${position === 'top' ? classes.actionButtonsTop : classes.actionButtonsBottom}`}>
          <Button onClick={handleUpdateClicked} variant="contained" color="primary" className={classes.updateButton}>
            Update
          </Button>
          <Button onClick={handleDeleteClicked} variant="contained" color="secondary">
            Delete
          </Button>
        </div>
      </Grid>
    )
  }

  const attributeEntries = Object.entries(attributes).sort(([key]) => key === '_id' ? -1 : 1)

  return (
    <Grid container>
      {
        selected ?
          <UpdateAttributeDialog
            entityName={entity.entityName}
            attributeKey={selected}
            attribute={attributes[selected as keyof EntityModel]!}
            open={updateDialogOpen}
            onClose={() => setUpdateDialogOpen(false)}/> : ''
      }

      {getActionButtons('top')}

      <Grid item xs={12}>
        <TableContainer>
          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell/>
                <TableCell>Key</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attributeEntries.map(([key, attribute]) => (
                <TableRow key={key}
                          onClick={e => setSelected(key)}
                          selected={selected === key}>
                  <TableCell padding="checkbox">
                    <Radio
                      checked={selected === key}
                      inputProps={{ 'aria-label': `${key}-label` }}
                    />
                  </TableCell>
                  <TableCell component="th" id={`${key}-label`} scope="row" padding="none">
                    {key}
                  </TableCell>
                  <TableCell>{key === '_id' ? 'ID' : capitalize(attribute!.type)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {getActionButtons('bottom')}

    </Grid>
  )
}
