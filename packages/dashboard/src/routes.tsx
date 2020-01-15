import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { HomePage } from './pages/HomePage/HomePage'
import { EntityPage } from './pages/EntityPage/EntityPage'

export const routes = {
  Home: {
    path: '/',
    exact: true,
    component: HomePage
  },
  Entity: {
    path: '/entities/:entityName',
    exact: true,
    component: EntityPage
  },
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
