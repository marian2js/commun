import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { HomePage } from './pages/HomePage/HomePage'
import { EntityPage } from './pages/EntityPage/EntityPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { AddEntityPage } from './pages/AddEntityPage/AddEntityPage'
import { EmailPluginPage } from './pages/EmailPluginPage/EmailPluginPage'
import { SettingsPage } from './pages/SettingsPage/SettingsPage'
import { UsersPluginPage } from './pages/UsersPluginPage/UsersPluginPage'
import { SignUpPage } from './pages/SignUpPage/SignUpPage'
import { GraphQLPluginPage } from './pages/GraphQLPluginPage/GraphQLPluginPage'

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
  SignUp: {
    path: '/signup',
    exact: true,
    component: SignUpPage
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
  GraphQLPlugin: {
    path: '/plugins/graphql',
    exact: true,
    component: GraphQLPluginPage,
  },
  UsersPlugin: {
    path: '/plugins/users',
    exact: true,
    component: UsersPluginPage,
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
