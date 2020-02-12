import React, { useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Box, Container, makeStyles } from '@material-ui/core'
import 'graphiql/graphiql.css'
import { getAuthenticationHeader } from '../../utils/apiUtils'
import { Alert } from '@material-ui/lab'
import { ServerService } from '../../services/ServerService'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  graphql: {
    height: '80vh',
  },
}))

export const GraphQLPluginPage = () => {
  const classes = useStyles()
  const theme = useTheme()
  const GraphiQL = require('graphiql').default
  const [serverSettings, setServerSettings] = React.useState()

  const docsOpen = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    (async () => {
      setServerSettings(await ServerService.getServerSettings())
    })()
  }, [])

  async function graphQLFetcher (graphQLParams: any) {
    const authHeader = getAuthenticationHeader()
    const res = await fetch('/graphql', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(graphQLParams),
    })
    return res.json()
  }

  const defaultQuery =
    `{
  viewer {
    username
  }
}`

  return (
    <Layout>
      <Container maxWidth="lg" className={classes.graphql}>
        {
          serverSettings?.environment === 'production' && (
            <Box mb={2}>
              <Alert severity="info">
                This GraphQL Explorer uses your admin credentials for running queries against production data.
              </Alert>
            </Box>
          )
        }

        <GraphiQL fetcher={graphQLFetcher} defaultQuery={defaultQuery} docExplorerOpen={docsOpen}/>
      </Container>
    </Layout>
  )
}
