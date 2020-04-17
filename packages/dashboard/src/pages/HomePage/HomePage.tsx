import React, { useEffect, useState } from 'react'
import Typography from '@material-ui/core/Typography'
import { Layout } from '../../components/Layout/Layout'
import { UserService } from '../../services/UserService'
import { Button, Card, makeStyles } from '@material-ui/core'
import DescriptionIcon from '@material-ui/icons/Description'
import { ServerService, ServerSettings } from '../../services/ServerService'
import { Link } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  card: {
    padding: theme.spacing(5),
  },
}))

export const HomePage = () => {
  const classes = useStyles()
  const [username, setUsername] = useState<string | null>(null)
  const [serverSettings, setServerSettings] = React.useState<ServerSettings>()

  useEffect(() => {
    (async () => {
      setUsername(UserService.getUserData()?.username || null)
      setServerSettings(await ServerService.getServerSettings())
    })()
  }, [])

  return (
    <Layout>
      <Card className={classes.card}>
        <h2>Welcome {username}!</h2>
        {
          serverSettings && (
            <Typography paragraph variant="subtitle2">
              Your server is running in {serverSettings.environment}.&nbsp;
              {
                serverSettings.environment === 'production' ?
                  <>
                    You can use the <Link to="/plugins/graphql">GraphQL explorer</Link> to run queries and mutations.
                  </> :
                  <>
                    Make all the changes you need and, once you are ready, commit them to your source control system.
                  </>
              }
            </Typography>
          )
        }

        <Button color="primary" startIcon={<DescriptionIcon/>}>
          Read documentation
        </Button>
      </Card>
    </Layout>
  )
}
