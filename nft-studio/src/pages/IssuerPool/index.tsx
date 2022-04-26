import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { useDebugFlags } from '../../components/DebugFlags'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolDashboardPage } from './Dashboard'

export const IssuerPoolPage: React.FC = () => {
  const { path } = useRouteMatch()
  const { showAdditionalIssuerTabs } = useDebugFlags()
  return (
    <Switch>
      {showAdditionalIssuerTabs && <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />}
      <Route path={path} component={IssuerPoolDashboardPage} />
    </Switch>
  )
}
