import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolDashboardPage } from './Dashboard'

export const IssuerPoolPage: React.FC = () => {
  const { path } = useRouteMatch()
  return (
    <Switch>
      <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />
      <Route path={path} component={IssuerPoolDashboardPage} />
    </Switch>
  )
}
