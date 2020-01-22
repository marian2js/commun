import React, { useEffect, useState } from 'react'
import { AppBar, Box, CircularProgress, Snackbar, Tab, Tabs, Typography } from '@material-ui/core'
import { Layout } from '../../components/Layout/Layout'
import { SettingsService } from '../../services/SettingsService'
import { CommunOptions } from '@commun/core'
import { SettingsEnvForm } from './SettingsEnvForm'
import AddIcon from '@material-ui/icons/Add'
import { SettingsAddEnvForm } from './SettingsAddEnvForm'
import { Alert } from '@material-ui/lab'

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
  const [settings, setSettings] = useState<{ [key: string]: CommunOptions }>()
  const [environments, setEnvironments] = useState<string[]>([])
  const [tabIndex, setTabIndex] = useState(0)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

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

  const handleEnvironmentAdd = (environment: string, envSettings: CommunOptions) => {
    setSettings({
      ...settings,
      [environment]: envSettings
    })
    setEnvironments([...environments, environment])
  }

  const handleEnvironmentUpdate = () => {
    setSnackbarOpen(true)
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
                variant="scrollable"
                scrollButtons="auto">
            {
              environments.map((env, i) => <Tab label={env} key={i} {...tabProps(i)} />)
            }
            <Tab wrapped label={
              <div><AddIcon style={{ verticalAlign: 'middle' }}/> <span>Add environment</span></div>
            } {...tabProps(environments.length)} />
          </Tabs>
        </AppBar>
        {
          environments.map((env, i) => (
            <TabPanel key={i} value={tabIndex} index={i}>
              <SettingsEnvForm settings={settings[env]} environment={env} onUpdate={handleEnvironmentUpdate}/>
            </TabPanel>
          ))
        }
        <TabPanel value={tabIndex} index={environments.length}>
          <SettingsAddEnvForm onEnvironmentAdded={handleEnvironmentAdd}/>
        </TabPanel>

        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity="success">
            Environment updated
          </Alert>
        </Snackbar>
      </>
    </Layout>
  )
}
