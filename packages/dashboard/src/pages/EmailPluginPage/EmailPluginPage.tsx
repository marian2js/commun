import React, { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { CircularProgress, Container, makeStyles, Typography } from '@material-ui/core'
import { PluginService } from '../../services/PluginService'
import { ExpansionMenu } from '../../components/ExpansionMenu'
import { EmailConfig } from '@commun/emails'
import { EmailPluginSettings } from './EmailPluginSettings'

const useStyles = makeStyles(theme => ({
  header: {
    marginBottom: theme.spacing(2),
  },
}))

export const EmailPluginPage = () => {
  const classes = useStyles()
  const [plugin, setPlugin] = useState<EmailConfig | undefined>()

  useEffect(() => {
    (async () => {
      const res = await PluginService.getPlugin<EmailConfig>('emails')
      setPlugin(res.item)
    })()
  }, [])

  if (!plugin) {
    return <CircularProgress/>
  }

  const menuItems = [{
    key: 'settings',
    label: 'General settings',
    component: <EmailPluginSettings plugin={plugin}/>,
    expanded: true,
  }, {
    key: 'templates',
    label: 'Templates',
    component: <div>Not implemented yet</div>,
  }]

  return (
    <Layout>
      <Container maxWidth="lg">

        <header className={classes.header}>
          <Typography variant="h5">
            Emails Plugin
          </Typography>
        </header>

        <ExpansionMenu items={menuItems}/>

      </Container>
    </Layout>
  )
}
