import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { PoolDetailAssetsTab } from './Assets'
import { PoolDetailLiquidityTab } from './Liquidity'
import { PoolDetailOverviewTab } from './Overview'

export const PoolDetailPage: React.FC = () => {
  const { path } = useRouteMatch()
  return (
    <Switch>
      <Route path={`${path}/liquidity`} component={PoolDetailLiquidityTab} />
      <Route path={`${path}/assets`} component={PoolDetailAssetsTab} />
      <Route path={path} component={PoolDetailOverviewTab} />
    </Switch>
  )
}
