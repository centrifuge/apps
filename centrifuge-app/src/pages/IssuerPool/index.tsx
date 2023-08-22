import * as React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router'
import { IssuerPoolAccessPage } from './Access'
import { IssuerPoolAssetPage } from './Assets'
import { IssuerPoolConfigurationPage } from './Configuration'
import { IssuerPoolCreateLoanTemplatePage } from './Configuration/CreateLoanTemplate'
import { IssuerPoolViewLoanTemplatePage } from './Configuration/ViewLoanTemplate'
import { IssuerPoolInvestorsPage } from './Investors'
import { IssuerPoolLiquidityPage } from './Liquidity'
import { IssuerPoolOverviewPage } from './Overview'
import { IssuerPoolReportingPage } from './Reporting'

export const IssuerPoolPage: React.FC = () => {
  const { path } = useRouteMatch()

  return (
    <Switch>
      <Route path={`${path}/configuration/view-asset-template/:sid`} component={IssuerPoolViewLoanTemplatePage} />
      <Route path={`${path}/configuration/create-asset-template`} component={IssuerPoolCreateLoanTemplatePage} />
      <Route path={`${path}/configuration`} component={IssuerPoolConfigurationPage} />
      <Route path={`${path}/investors`} component={IssuerPoolInvestorsPage} />
      <Route path={`${path}/access`} component={IssuerPoolAccessPage} />
      <Route path={`${path}/assets`} component={IssuerPoolAssetPage} />
      <Route path={`${path}/liquidity`} component={IssuerPoolLiquidityPage} />
      <Route path={`${path}/reporting`} component={IssuerPoolReportingPage} />
      <Route path={path} component={IssuerPoolOverviewPage} />
    </Switch>
  )
}
