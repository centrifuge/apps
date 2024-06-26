import { Route, Switch, useRouteMatch } from 'react-router'
import { PoolDetailAssetsTab } from './Assets'
import { PoolDetailLiquidityTab } from './Liquidity'
import { PoolDetailOverviewTab } from './Overview'
import { PoolFeesTab } from './PoolFees'
import { PoolDetailReportingTab } from './Reporting'

export default function PoolDetailPage() {
  const { path } = useRouteMatch()
  return (
    <Switch>
      <Route path={`${path}/reporting/:report`} component={PoolDetailReportingTab} />
      <Route path={`${path}/reporting`} component={PoolDetailReportingTab} />
      <Route path={`${path}/liquidity`} component={PoolDetailLiquidityTab} />
      <Route path={`${path}/assets`} component={PoolDetailAssetsTab} />
      <Route path={`${path}/fees`} component={PoolFeesTab} />
      <Route path={path} component={PoolDetailOverviewTab} />
    </Switch>
  )
}
