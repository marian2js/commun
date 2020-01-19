import React, { useState } from 'react'
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

const useStyles = makeStyles(theme => ({
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

interface TableItem {
  [key: string]: string | number
}

interface Props {
  headerKeys: {
    key: string
    label: string
  }[]
  items: TableItem[]
  addButtonLabel?: string
  onSelectChange?: (item: TableItem | null) => void
  onAddClick?: () => void
  onUpdateClick?: () => void
  onDeleteClick?: () => void
}

export const SelectTable = (props: Props) => {
  const classes = useStyles()
  const { headerKeys, items, addButtonLabel, onSelectChange, onAddClick, onUpdateClick, onDeleteClick } = props
  const [selected, setSelected] = useState<number>(-1)

  const handleSelectChange = (index: number) => {
    if (selected === index) {
      setSelected(-1)
      if (onSelectChange) {
        onSelectChange(null)
      }
    } else {
      setSelected(index)
      if (onSelectChange) {
        onSelectChange(items[index])
      }
    }
  }

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick()
    }
  }

  const handleUpdateClick = () => {
    if (onUpdateClick) {
      onUpdateClick()
    }
  }

  const handleDeleteClick = () => {
    if (onDeleteClick) {
      onDeleteClick()
    }
    setSelected(-1)
    if (onSelectChange) {
      onSelectChange(null)
    }
  }

  const getActionButtons = (position: 'top' | 'bottom' | 'center') => {
    let buttons
    if (selected === -1) {
      buttons = (
        <Button onClick={handleAddClick} variant="contained" color="primary">
          {addButtonLabel || 'Add'}
        </Button>
      )
    } else {
      buttons = (
        <>
          <Button onClick={handleUpdateClick} variant="contained" color="primary" className={classes.updateButton}>
            Update
          </Button>
          <Button onClick={handleDeleteClick} variant="contained" color="secondary">
            Delete
          </Button>
        </>
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

  if (!items.length) {
    return (
      <Grid container>
        {getActionButtons('center')}
      </Grid>
    )
  }

  return (
    <Grid container>
      {getActionButtons('top')}

      <Grid item xs={12}>
        <TableContainer>
          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell/>
                {
                  headerKeys.map(headerKey => <TableCell key={headerKey.key}>{headerKey.label}</TableCell>)
                }
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}
                          onClick={() => handleSelectChange(i)}
                          selected={selected === i}>
                  <TableCell padding="checkbox">
                    <Radio
                      checked={selected === i}
                      inputProps={{ 'aria-label': `${i}-label` }}
                    />
                  </TableCell>
                  <TableCell component="th" id={`${i}-label`} scope="row" padding="none">
                    {item[headerKeys[0].key]}
                  </TableCell>
                  {
                    headerKeys.slice(1).map(headerKey => (
                      <TableCell key={headerKey.key}>{item[headerKey.key]}</TableCell>
                    ))
                  }
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
