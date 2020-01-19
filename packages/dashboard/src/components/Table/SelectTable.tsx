import React, { useState } from 'react'
import { makeStyles, Radio, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  table: {
    maxWidth: '100%'
  },
}))

interface TableItem {
  [key: string]: string
}

interface Props {
  headerKeys: {
    key: string
    label: string
  }[]
  items: TableItem[]
  onSelectChange?: (item: TableItem | null) => void
}

export const SelectTable = (props: Props) => {
  const classes = useStyles()
  const { headerKeys, items, onSelectChange } = props
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

  return (
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
                headerKeys.slice(1).map(headerKey => <TableCell key={headerKey.key}>{item[headerKey.key]}</TableCell>)
              }
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
