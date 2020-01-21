import React, { useEffect, useState } from 'react'
import { AppBar, Box, CircularProgress, Tab, Tabs, Typography } from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { SettingsService } from '../../services/SettingsService'
import { CommunOptions } from '@commun/core'
import { SettingsEnvForm } from './SettingsEnvForm'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function tabProps (index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

function TabPanel (props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  )
}

export const SettingsPage = () => {
  const theme = useTheme()
  const [settings, setSettings] = useState<{ [key: string]: CommunOptions }>()
  const [environments, setEnvironments] = useState<string[]>([])
  const [tabIndex, setTabIndex] = useState(0)

  const smDownScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    (async () => {
      const settings = await SettingsService.getSettings()
      setEnvironments(Object.keys(settings))
      setSettings(settings)
    })()
  }, [])

  if (!settings) {
    return <CircularProgress/>
  }

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue)
  }

  return (
    <Layout noPadding={true}>
      <>
        <AppBar position="static">
          <Tabs value={tabIndex}
                onChange={handleTabChange}
                aria-label="setting tabs"
                variant={smDownScreen ? 'fullWidth' : 'standard'}>
            {
              environments.map((env, i) => <Tab label={env} key={i} {...tabProps(i)} />)
            }
          </Tabs>
        </AppBar>
        {
          environments.map((env, i) => (
            <TabPanel value={tabIndex} index={i}>
              <SettingsEnvForm settings={settings[env]} environment={env}/>
            </TabPanel>
          ))
        }
      </>
    </Layout>
  )
}
