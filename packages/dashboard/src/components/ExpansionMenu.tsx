import React, { useState } from 'react'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, makeStyles, Typography } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

const useStyles = makeStyles(theme => ({
  header: {
    marginBottom: theme.spacing(2),
  },
  expansionPanelHeading: {
    fontSize: theme.typography.pxToRem(18),
    flexShrink: 0,
  },
}))

interface Props {
  items: {
    expanded?: boolean
    key: string
    label: string
    component: JSX.Element
  }[]
}

export const ExpansionMenu = (props: Props) => {
  const classes = useStyles()
  const { items } = props
  const initialExpanded = items.reduce((prev: { [key: string]: boolean }, curr) => {
    if (curr.expanded) {
      prev[curr.key] = true
    }
    return prev
  }, {})
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>(initialExpanded)

  const handleExpansion = (panelKey: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
    setExpanded({ ...expanded, [panelKey]: !expanded[panelKey] })
  }

  return (
    <>
      {
        items.map(item => (
          <ExpansionPanel key={item.key}
                          expanded={expanded[item.key]}
                          onChange={handleExpansion(item.key)}
                          TransitionProps={{ unmountOnExit: true }}>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls={`${item.key}-content`}
              id={`${item.key}-content`}>
              <Typography className={classes.expansionPanelHeading}>{item.label}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              {item.component}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ))
      }
    </>
  )
}
