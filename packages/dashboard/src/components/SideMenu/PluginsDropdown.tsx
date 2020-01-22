import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ExtensionIcon from '@material-ui/icons/Extension'
import ListItemText from '@material-ui/core/ListItemText'
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import { Collapse } from '@material-ui/core'
import List from '@material-ui/core/List'
import EmailIcon from '@material-ui/icons/Email'
import VpnKeyIcon from '@material-ui/icons/VpnKey'
import React from 'react'
import { Link } from 'react-router-dom'

export function PluginsDropdown () {
  const [open, setOpen] = React.useState(true)

  return (
    <>
      <ListItem button onClick={() => setOpen(!open)}>
        <ListItemIcon>
          <ExtensionIcon/>
        </ListItemIcon>
        <ListItemText primary="Plugins"/>
        {open ? <ExpandLess/> : <ExpandMore/>}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to="/plugins/emails">
            <ListItemIcon><EmailIcon/></ListItemIcon>
            <ListItemText primary="Emails"/>
          </ListItem>
          <ListItem button component={Link} to="/plugins/users">
            <ListItemIcon><VpnKeyIcon/></ListItemIcon>
            <ListItemText primary="Users"/>
          </ListItem>
        </List>
      </Collapse>
    </>
  )
}
