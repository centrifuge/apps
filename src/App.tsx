import React, { Component } from 'react';
import { Box } from 'grommet';
import { AxisTheme } from '@centrifuge/axis-theme';

import Routing, { RouteItem } from './Routing';
import Header, { MenuItem } from './Header';
import { connect } from 'react-redux';
import { User } from './common/models/user';
import { push, RouterAction } from 'connected-react-router';
import { PERMISSIONS } from './common/constants';
import routes from './routes';
import InvoiceList from './invoices/InvoiceList';
import UsersList from './admin/users/UsersList';
import CreateInvoice from './invoices/Create';
import { ConnectedFundingAgreementView } from './invoices/FundingAgreementView';
import EditInvoice from './invoices/Edit';
import Contacts from './contacts/View';
import { NotificationProvider } from './notifications/NotificationContext';
import FundingAgreementList from './invoices/FundingAgreementList';
import { ConnectedInvoiceView } from './invoices/InvoiceView';

interface AppPros {
  selectedRoute: string;
  loggedInUser: User | null;
  push: (route) => RouterAction
}


class App extends Component<AppPros> {
  render() {

    const {
      selectedRoute,
      loggedInUser,
      push,
    } = this.props;

    let menuItems: MenuItem[] = [];
    let routeItems: RouteItem[] = [];

    if (loggedInUser) {

      if (loggedInUser.permissions.includes(PERMISSIONS.CAN_MANAGE_USERS)) {
        menuItems.push(
          { label: 'Users', route: routes.user.index },
        );
        routeItems.push(
          {
            path: routes.user.index,
            component: UsersList,
          },
        );
      }

      if (loggedInUser.permissions.includes(PERMISSIONS.CAN_CREATE_INVOICES)) {
        menuItems.push(...[
          { label: 'Contacts', route: routes.contacts.index },
          { label: 'Invoices', route: routes.invoices.index },
        ]);

        routeItems.push(
          {
            path: routes.contacts.index,
            component: Contacts,
          },
          {
            path: routes.invoices.index,
            component: InvoiceList,
          },
          {
            path: routes.invoices.new,
            component: CreateInvoice,
          },
          {
            path: routes.invoices.view,
            component: ConnectedInvoiceView,
          },
          {
            path: routes.invoices.edit,
            component: EditInvoice,
          },
        );
      }

      if (loggedInUser.permissions.includes(PERMISSIONS.CAN_FUND_INVOICES)) {
        menuItems.push(...[
          { label: 'Funding Agreements', route: routes.funding.index },
        ]);
        routeItems.push(
          {
            path: routes.funding.index,
            component: FundingAgreementList,
          },
          {
            path: routes.funding.view,
            component: ConnectedFundingAgreementView,
          },
        );
      }

      menuItems.push({ label: 'Log out', route: routes.user.logout, external: true, secondary: true });

    }

    return (
      <div className="App">
        <AxisTheme full={true}>
          <NotificationProvider>
            <Box fill align="center">
              <Header
                user={loggedInUser}
                selectedRoute={selectedRoute}
                menuItems={menuItems.reverse()}
                push={push}
              />
              <Box
                justify="center"
                direction="row"
                fill
                overflow={'scroll'}
              >
                <Box width="xlarge">
                  <div style={{ minHeight: '100%' }}>
                    <Routing routes={routeItems}/>
                  </div>

                </Box>
              </Box>

            </Box>
          </NotificationProvider>
        </AxisTheme>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    selectedRoute: state.router.location.pathname,
    loggedInUser: state.user.auth.loggedInUser,
  };
};

export default connect(
  mapStateToProps,
  { push },
)(App);
