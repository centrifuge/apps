import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { PoolDetailAssetsTab } from './AssetsTab'
import { PoolDetailLiquidityTab } from './LiquidityTab'
import { PoolDetailOverviewTab } from './OverviewTab'

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
