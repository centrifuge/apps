import { DisplayField } from '@centrifuge/axis-display-field'
import { MenuItem, NavBar } from '@centrifuge/axis-nav-bar'
import { AxisTheme } from '@centrifuge/axis-theme'
import { User } from '@centrifuge/gateway-lib/models/user'
import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants'
import { getAddressLink } from '@centrifuge/gateway-lib/utils/etherscan'
import { Anchor, Box, Image, Text } from 'grommet'
import React, { FunctionComponent, useState } from 'react'
import { RouteComponentProps, withRouter } from 'react-router'
import logo from './assets/logo.png'
import { NotificationProvider } from './components/NotificationContext'
import Contacts from './contacts/ViewContacts'
import CreateDocument from './documents/CreateDocument'
import EditDocument from './documents/EditDocument'
import ListDocuments from './documents/ListDocuments'
import ViewDocument from './documents/ViewDocument'
import routes from './routes'
import Routing, { RouteItem } from './Routing'
import SchemaList from './schemas/SchemaList'
import { theme } from './theme'
import UsersList from './users/UsersList'

interface AppPros extends RouteComponentProps {
  loggedInUser: User | null
}

const loggedInUser = window['__PRELOADED_STATE__'] ? window['__PRELOADED_STATE__'].user : null

export const AppContext = React.createContext<{
  user: User | null
  setUser: (user) => void
}>({
  user: loggedInUser,
  setUser: (user) => {},
})

const App: FunctionComponent<AppPros> = (props: AppPros) => {
  const {
    loggedInUser,
    location: { pathname },
    history: { push },
  } = props

  const [user, setUser] = useState(loggedInUser)

  let menuItems: MenuItem[] = []
  let routeItems: RouteItem[] = []

  //TODO move this a function that generates menuItems and routes items based on a user
  if (user) {
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
      route: routes.user.logout,
      external: true,
      secondary: true,
    })
  }

  return (
    <div className="App">
      <AxisTheme theme={theme} full={true}>
        <AppContext.Provider value={{ user, setUser }}>
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
                  if (item.external) {
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
        </AppContext.Provider>
      </AxisTheme>
    </div>
  )
}

export default withRouter(App)
