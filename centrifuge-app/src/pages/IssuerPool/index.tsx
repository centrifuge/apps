import * as React from 'react'
import { Route, Switch, useParams, useRouteMatch } from 'react-router'
import { PoolChangesBanner } from '../../components/PoolChangesBanner'
import { IssuerPoolAccessPage } from './Access'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolCreateLoanTemplatePage } from './Configuration/CreateLoanTemplate'
import { IssuerPoolViewLoanTemplatePage } from './Configuration/ViewLoanTemplate'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'
import { IssuerPoolFeesPage } from './PoolFees'
import { IssuerPoolReportingPage } from './Reporting'

export default function IssuerPoolPage() {
  const { path } = useRouteMatch()
  const { pid: poolId } = useParams<{ pid: string }>()

  return (
    <>
      <Switch>
        <Route path={`${path}/configuration/view-asset-template/:sid`} component={IssuerPoolViewLoanTemplatePage} />
        <Route path={`${path}/configuration/create-asset-template`} component={IssuerPoolCreateLoanTemplatePage} />
        <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />
        <Route path={`${path}/investors`} component={IssuerPoolInvestorsPage} />
        <Route path={`${path}/access`} component={IssuerPoolAccessPage} />
        <Route path={`${path}/assets`} component={IssuerPoolAssetPage} />
        <Route path={`${path}/liquidity`} component={IssuerPoolLiquidityPage} />
        <Route path={`${path}/reporting`} component={IssuerPoolReportingPage} />
        <Route path={`${path}/pool-fees`} component={IssuerPoolFeesPage} />
        <Route path={path} component={IssuerPoolOverviewPage} />
      </Switch>
      <PoolChangesBanner poolId={poolId} />
    </>
  )
}
