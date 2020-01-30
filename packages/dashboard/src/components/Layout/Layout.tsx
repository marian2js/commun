import React, { useEffect } from 'react'
import AppBar from '@material-ui/core/AppBar'
import CssBaseline from '@material-ui/core/CssBaseline'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { createStyles, makeStyles, Theme } from '@material-ui/core'
import { SideMenu } from '../SideMenu/SideMenu'
import { ServerService } from '../../services/ServerService'

const drawerWidth = 240

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    toolbar: theme.mixins.toolbar as any,
    title: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
    },
    contentPadding: {
      padding: theme.spacing(3),
    }
  }),
)

interface Props {
  children: JSX.Element[] | JSX.Element
  noPadding?: boolean
}

export function Layout (props: Props) {
  const classes = useStyles()
  const { noPadding } = props
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [serverSettings, setServerSettings] = React.useState()

  useEffect(() => {
    (async () => {
      setServerSettings(await ServerService.getServerSettings())
    })()
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <div className={classes.root}>
      <CssBaseline/>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}>
            <MenuIcon/>
          </IconButton>
          <Typography variant="h6" noWrap className={classes.title}>
            Dashboard
          </Typography>

          {
            serverSettings && (
              <Typography variant="subtitle2" noWrap>
                Running in {serverSettings.environment}
              </Typography>
            )
          }

        </Toolbar>
      </AppBar>
      <SideMenu onDrawerToggle={handleDrawerToggle} open={mobileOpen} serverSettings={serverSettings}/>
      <main className={`${classes.content} ${noPadding ? '' : classes.contentPadding}`}>
        <div className={classes.toolbar}/>
        {props.children}
      </main>
    </div>
  )
}
