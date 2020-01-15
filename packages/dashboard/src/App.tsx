import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { dashboardRouterSwitch } from './routes'

const App: React.FC = () => (
  <Router>
    {dashboardRouterSwitch}
  </Router>
)

export default App
