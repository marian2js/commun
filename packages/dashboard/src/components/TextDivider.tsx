import { makeStyles } from '@material-ui/core'
import React from 'react'

const useStyles = makeStyles(theme => ({
  textDivider: {
    margin: theme.spacing(2, 0),
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    '&::before': {
      content: '""',
      flex: 1,
      borderBottom: '1px solid rgba(0, 0, 0, 0.54)',
      marginRight: theme.spacing(1),
    },
    '&::after': {
      content: '""',
      flex: 1,
      borderBottom: '1px solid rgba(0, 0, 0, 0.54)',
      marginLeft: theme.spacing(1),
    },
  }
}))

interface Props {
  children: JSX.Element[] | JSX.Element
}

export const TextDivider = (props: Props) => {
  const classes = useStyles()

  return (
    <div className={classes.textDivider}>{props.children}</div>
  )
}
