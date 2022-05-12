import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { useDebugFlags } from '../../components/DebugFlags'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'

export const IssuerPoolPage: React.FC = () => {
  const { path } = useRouteMatch()
  const { showAdditionalIssuerTabs } = useDebugFlags()
  return (
    <Switch>
      {showAdditionalIssuerTabs && <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />}
      {showAdditionalIssuerTabs && <Route path={`${path}/investors`} component={IssuerPoolInvestorsPage} />}
      <Route path={`${path}/assets`} component={IssuerPoolAssetPage} />
      <Route path={`${path}/liquidity`} component={IssuerPoolLiquidityPage} />
      <Route path={path} component={IssuerPoolOverviewPage} />
    </Switch>
  )
}
