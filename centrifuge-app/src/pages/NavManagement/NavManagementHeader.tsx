import { useParams, useRouteMatch } from 'react-router'
import { NavigationTabs, NavigationTabsItem } from '../../components/NavigationTabs'
import { IssuerHeader } from '../IssuerPool/Header'

export function NavManagementHeader() {
  const { pid } = useParams<{ pid: string }>()
  const basePath = useRouteMatch('/nav-management')?.path || ''

  return (
    <IssuerHeader>
      <NavigationTabs basePath={`${basePath}/${pid}`}>
        <NavigationTabsItem to={`${basePath}/${pid}`}>NAV Overview</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/fees`}>Fee activity</NavigationTabsItem>
        <NavigationTabsItem to={`${basePath}/${pid}/investors`}>Investor activity</NavigationTabsItem>
      </NavigationTabs>
    </IssuerHeader>
  )
}
