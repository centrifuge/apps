import React, { FunctionComponent } from 'react'
import { Anchor, Box, Image, Text } from 'grommet'
import { AxisTheme } from '@centrifuge/axis-theme'
import Routing, { RouteItem } from './Routing'
import { MenuItem, NavBar } from '@centrifuge/axis-nav-bar'
import { User } from '@centrifuge/gateway-lib/models/user'
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants'
import routes from './routes'
import UsersList from './users/UsersList'
import Contacts from './contacts/ViewContacts'
import { NotificationProvider } from './components/NotificationContext'
import SchemaList from './schemas/SchemaList'
import ListDocuments from './documents/ListDocuments'
import CreateDocument from './documents/CreateDocument'
import ViewDocument from './documents/ViewDocument'
import EditDocument from './documents/EditDocument'
import { getAddressLink } from '@centrifuge/gateway-lib/utils/etherscan'
import { DisplayField } from '@centrifuge/axis-display-field'
import logo from './assets/logo.png'
import { RouteComponentProps, withRouter } from 'react-router'
import { theme } from './theme'
import { Auth } from './auth/Auth'

const App: FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const {
    location: { pathname },
    history: { push },
  } = props

  return (
    <div className="App">
      <AxisTheme theme={theme} full={true}>
        <Auth>
          {(user, logout) => {
            const [menuItems, routeItems] = menuAndRouteItems(user, logout)
            return (
              <NotificationProvider>
                <Box align="center">
                  <NavBar
                    width={'xxlarge'}
                    logo={
                      <Anchor href="/">
                        <Image src={logo} />
                      </Anchor>
                    }
                    selectedRoute={pathname}
                    menuLabel={user ? user.email : ''}
                    menuItems={menuItems.reverse()}
                    onRouteClick={(item) => {
                      if (item.onClick) {
                        item.onClick()
                      } else if (item.external) {
                        window.location.replace(item.route)
                      } else {
                        push(item.route)
                      }
                    }}
                  >
                    {user && (
                      <Box direction="row" gap={'medium'} align={'center'} justify="end">
                        <Box direction="row" align="center" gap={'xsmall'}>
                          <Text>Centrifuge ID: </Text>
                          <Box width={'160px'}>
                            <DisplayField
                              copy={true}
                              link={{
                                href: getAddressLink(user.account),
                                target: '_blank',
                              }}
                              value={user.account}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </NavBar>
                  <Box justify="center" direction="row">
                    <Box width="xxlarge">
                      <Routing routes={routeItems} />
                    </Box>
                  </Box>
                </Box>
              </NotificationProvider>
            )
          }}
        </Auth>
      </AxisTheme>
    </div>
  )
}

export default withRouter(App)

function menuAndRouteItems(user: null | User, logout: () => void): [MenuItem[], RouteItem[]] {
  let menuItems: MenuItem[] = []
  let routeItems: RouteItem[] = []

  if (!user) {
    return [menuItems, routeItems]
  }

  // There are no special permission for contacts
  menuItems.push({ label: 'Contacts', route: routes.contacts.index })
  routeItems.push({
    path: routes.contacts.index,
    component: Contacts,
  })

  if (user.permissions.includes(PERMISSIONS.CAN_MANAGE_SCHEMAS)) {
    menuItems.push({ label: 'Schemas', route: routes.schemas.index })
    routeItems.push({
      path: routes.schemas.index,
      component: SchemaList,
    })
  }

  if (user.permissions.includes(PERMISSIONS.CAN_MANAGE_USERS)) {
    menuItems.push({ label: 'Users', route: routes.user.index })
    routeItems.push({
      path: routes.user.index,
      component: UsersList,
    })
  }

  if (
    user.permissions.includes(PERMISSIONS.CAN_VIEW_DOCUMENTS) ||
    user.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)
  ) {
    menuItems.push({ label: 'Documents', route: routes.documents.index })

    // The order is important and the path are similar and routes will match first route it finds
    // documents/new can match documents/{id} if the routes is declared after
    if (user.schemas.length) {
      routeItems.push({
        path: routes.documents.new,
        component: CreateDocument,
      })
    }

    routeItems.push(
      {
        path: routes.documents.index,
        component: ListDocuments,
      },
      {
        path: routes.documents.view,
        component: ViewDocument,
      },
      {
        path: routes.documents.edit,
        component: EditDocument,
      }
    )
  }

  menuItems.push({
    label: 'Log out',
    route: '',
    onClick: logout,
    secondary: true,
  })

  return [menuItems, routeItems]
}
