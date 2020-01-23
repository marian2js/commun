import Hidden from '@material-ui/core/Hidden'
import Drawer from '@material-ui/core/Drawer'
import React from 'react'
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles'
import Divider from '@material-ui/core/Divider'
import List from '@material-ui/core/List'
import { EntitiesDropdown } from './EntitiesDropdown'
import { PluginsDropdown } from './PluginsDropdown'
import { Link } from 'react-router-dom'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import SettingsIcon from '@material-ui/icons/Settings'
import ListItemText from '@material-ui/core/ListItemText'
import ListItem from '@material-ui/core/ListItem'

const drawerWidth = 240

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    toolbar: theme.mixins.toolbar as any,
    drawerPaper: {
      width: drawerWidth,
    },
  }),
)

interface Props {
  open: boolean
  onDrawerToggle: () => void
}

export function SideMenu (props: Props) {
  const classes = useStyles()
  const theme = useTheme()

  const drawer = (
    <div>
      <div className={classes.toolbar}/>
      <Divider/>
      <List>
        <EntitiesDropdown/>
        <Divider/>
        <PluginsDropdown/>
        <Divider/>
        <ListItem button component={Link} to="/settings">
          <ListItemIcon><SettingsIcon/></ListItemIcon>
          <ListItemText primary="Settings"/>
        </ListItem>
      </List>
    </div>
  )

  return (
    <nav className={classes.drawer} aria-label="mailbox folders">
      <Hidden smUp implementation="css">
        <Drawer
          variant="temporary"
          anchor={theme.direction === 'rtl' ? 'right' : 'left'}
          open={props.open}
          onClose={props.onDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
      <Hidden xsDown implementation="css">
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="permanent"
          open>
          {drawer}
        </Drawer>
      </Hidden>
    </nav>
  )
}
