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
import { EntityConfig, EntityModel, JoinAttribute } from '@commun/core'
import { JoinAttributeDialog } from '../../components/Dialogs/JoinAttributeDialog'
import { EntityService } from '../../services/EntityService'

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
  },
  actionButtonsCenter: {
    float: 'initial',
    textAlign: 'center',
  },
}))

interface Props {
  entity: EntityConfig<EntityModel>
}

export const EntityJoinAttributes = (props: Props) => {
  const classes = useStyles()
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

  const getActionButtons = (position: 'top' | 'bottom' | 'center') => {
    let buttons
    if (selected) {
      buttons = (
        <>
          <Button onClick={handleUpdateClicked} variant="contained" color="primary" className={classes.updateButton}>
            Update
          </Button>
          <Button onClick={handleDeleteClicked} variant="contained" color="secondary">
            Delete
          </Button>
        </>
      )
    } else {
      buttons = (
        <Button onClick={handleAddClicked} variant="contained" color="primary">
          Add Attribute
        </Button>
      )
    }

    let className
    switch (position) {
      case 'top':
        className = classes.actionButtonsTop
        break
      case 'bottom':
        className = classes.actionButtonsBottom
        break
      case 'center':
        className = classes.actionButtonsCenter
        break
    }

    return (
      <Grid item xs={12}>
        <div
          className={`${classes.actionButtons} ${className}`}>
          {buttons}
        </div>
      </Grid>
    )
  }

  const dialog = (
    <JoinAttributeDialog
      entity={entity}
      attributeKey={selected || undefined}
      joinAttribute={selected ? joinAttributes[selected] : undefined}
      open={attributeDialogOpen}
      onChange={handleJoinAttributesChange}
      onCancel={() => setAttributeDialogOpen(false)}/>
  )

  if (!Object.keys(joinAttributes).length) {
    return (
      <Grid container>
        {dialog}
        {getActionButtons('center')}
      </Grid>
    )
  }

  return (
    <Grid container>
      {dialog}

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
              {Object.entries(joinAttributes).map(([key, attribute]) => (
                <TableRow key={key}
                          onClick={() => selected === key ? setSelected('') : setSelected(key)}
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
                  <TableCell>{attribute.type} on {attribute.entity}</TableCell>
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
