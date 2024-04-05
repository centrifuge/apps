import { Route, Switch, useRouteMatch } from 'react-router'
import NavManagementFeesPage from './Fees'
import NavManagementInvestorsPage from './Investors'
import NavManagementOverviewPage from './Overview'

export default function IssuerPoolPage() {
  const { path } = useRouteMatch()

  return (
    <Switch>
      <Route path={`${path}/investors`} component={NavManagementInvestorsPage} />
      <Route path={`${path}/fees`} component={NavManagementFeesPage} />
      <Route path={path} component={NavManagementOverviewPage} />
    </Switch>
  )
}
