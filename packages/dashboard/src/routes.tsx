import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { HomePage } from './pages/HomePage/HomePage'
import { EntityPage } from './pages/EntityPage/EntityPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { AddEntityPage } from './pages/AddEntityPage/AddEntityPage'
import { EmailPluginPage } from './pages/EmailPluginPage/EmailPluginPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'

export const routes = {
  Home: {
    path: '/',
    exact: true,
    component: HomePage
  },
  Login: {
    path: '/login',
    exact: true,
    component: LoginPage
  },
  Entity: {
    path: '/entities/:entityName',
    exact: true,
    component: EntityPage
  },
  AddEntity: {
    path: '/add-entity',
    exact: true,
    component: AddEntityPage
  },
  EmailPlugin: {
    path: '/plugins/emails',
    exact: true,
    component: EmailPluginPage
  },
  Settings: {
    path: '/settings',
    exact: true,
    component: SettingsPage
  }
}

const routeDetails = Object.values(routes)

const routeContent = routeDetails.map(route =>
  <Route key={route.path} component={route.component} path={route.path} exact={route.exact}/>
)

export const dashboardRouterSwitch = (
  <Switch>
    {routeContent}
    {/*<Route component={PageNotFound}/>*/}
  </Switch>
)
