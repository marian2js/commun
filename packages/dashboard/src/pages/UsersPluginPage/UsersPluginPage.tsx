import React, { useEffect, useState } from 'react'
import { CircularProgress, Container, makeStyles, Typography } from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { PluginService } from '../../services/PluginService'
import { UserModuleSettings } from '@commun/users'
import { ExpansionMenu } from '../../components/ExpansionMenu'
import { UsersTokenSettings } from './UsersTokenSettings'
import { UsersSocialLogin } from './UsersSocialLogin'

const useStyles = makeStyles(theme => ({
  header: {
    marginBottom: theme.spacing(2),
  },
}))

export const UsersPluginPage = () => {
  const classes = useStyles()
  const [plugin, setPlugin] = useState<UserModuleSettings | undefined>()

  useEffect(() => {
    (async () => {
      const res = await PluginService.getPlugin<UserModuleSettings>('users')
      setPlugin(res.item)
    })()
  }, [])

  if (!plugin) {
    return <CircularProgress/>
  }

  const menuItems = [{
    key: 'social-login',
    label: 'Social Login',
    component: <UsersSocialLogin plugin={plugin}/>,
    expanded: true,
  }, {
    key: 'security',
    label: 'Token settings',
    component: <UsersTokenSettings plugin={plugin}/>,
    expanded: true,
  }]

  return (
    <Layout>
      <Container maxWidth="lg">

        <header className={classes.header}>
          <Typography variant="h5">
            Users Plugin
          </Typography>
        </header>

        <ExpansionMenu items={menuItems}/>

      </Container>
    </Layout>
  )
}
