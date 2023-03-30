import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { Route, Switch, useParams, useRouteMatch } from 'react-router'
import { PoolDetailAssetsTab } from './Assets'
import { PoolDetailLiquidityTab } from './Liquidity'
import { PoolDetailOverviewTab } from './Overview'
import { PoolDetailReportingTab } from './Reporting'

export const PoolDetailPage: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const isTinlakePool = pid.startsWith('0x')
  const { setScopedNetwork } = useWallet()
  const { path } = useRouteMatch()

  React.useEffect(() => {
    setScopedNetwork(isTinlakePool ? 'evm' : 'substrate')

    return () => setScopedNetwork(null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Switch>
      <Route path={`${path}/reporting`} component={PoolDetailReportingTab} />
      <Route path={`${path}/liquidity`} component={PoolDetailLiquidityTab} />
      <Route path={`${path}/assets`} component={PoolDetailAssetsTab} />
      <Route path={path} component={PoolDetailOverviewTab} />
    </Switch>
  )
}
