import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'

export const IssuerPoolPage: React.FC = () => {
  const { path } = useRouteMatch()

  return (
    <Switch>
      <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />
      <Route path={`${path}/investors`} component={IssuerPoolInvestorsPage} />
      <Route path={`${path}/assets`} component={IssuerPoolAssetPage} />
      <Route path={`${path}/liquidity`} component={IssuerPoolLiquidityPage} />
      <Route path={path} component={IssuerPoolOverviewPage} />
    </Switch>
  )
}
