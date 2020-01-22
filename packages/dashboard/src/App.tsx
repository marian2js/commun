import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { dashboardRouterSwitch } from './routes'

const App: React.FC = () => (
  <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
    {dashboardRouterSwitch}
  </BrowserRouter>
)

export default App
