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
import { EntityConfig, EntityModel, ModelAttribute } from '@commun/core'
import capitalize from '@material-ui/core/utils/capitalize'
import { AttributeDialog } from '../../components/Dialogs/AttributeDialog'

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
  const [attributeDialogOpen, setAttributeDialogOpen] = useState<boolean>(false)

  useEffect(() => setAttributes(entity.attributes), [entity])

  const handleAddClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleUpdateClicked = () => {
    setAttributeDialogOpen(true)
  }

  const handleDeleteClicked = () => {
    // TODO
  }

  const handleAttributesChange = (attributeKey: string, attribute: ModelAttribute) => {
    attributes[attributeKey as keyof EntityModel] = attribute
    setAttributes(attributes)
    setAttributeDialogOpen(false)
  }

  const getActionButtons = (position: 'top' | 'bottom') => {
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

    return (
      <Grid item xs={12}>
        <div
          className={`${classes.actionButtons} ${position === 'top' ? classes.actionButtonsTop : classes.actionButtonsBottom}`}>
          {buttons}
        </div>
      </Grid>
    )
  }

  const getAttributeTypeLabel = (attribute: ModelAttribute) => {
    switch (attribute.type) {
      case 'id':
        return 'ID'
      case 'ref':
        return `Reference to ${capitalize(attribute.entity)}`
      case 'slug':
        return `Slug from ${attribute.setFrom}`
      default:
        return capitalize(attribute!.type)
    }
  }

  const attributeEntries = Object.entries(attributes).sort(([key]) => key === '_id' ? -1 : 1)

  return (
    <Grid container>
      <AttributeDialog
        entity={entity}
        attributeKey={selected || undefined}
        attribute={selected ? attributes[selected as keyof EntityModel] : undefined}
        open={attributeDialogOpen}
        onChange={handleAttributesChange}
        onCancel={() => setAttributeDialogOpen(false)}/>

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
                  <TableCell>{getAttributeTypeLabel(attribute!)}</TableCell>
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
