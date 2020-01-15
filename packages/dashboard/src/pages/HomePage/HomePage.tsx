import React from 'react'
import Typography from '@material-ui/core/Typography'
import { Layout } from '../../components/Layout/Layout'

export const HomePage = () => (
  <Layout>
    <h2>Welcome to your dashboard</h2>
    <Typography paragraph>
      You can configure your entities and plugins in the left bar.
    </Typography>
  </Layout>
)
