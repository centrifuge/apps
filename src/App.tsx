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
import { ConnectedNotifications } from './notifications/Notifications';
import SchemasList from './admin/schemas/SchemasList';
import ListDocuments from './documents/ListDocuments';
import CreateDocument from './documents/CreateDocument';
import ViewDocument from './documents/ViewDocument';
import EditDocument from './documents/EditDocument';

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


    //TODO move this a function that generates menuItems and routes items based on a user
    if (loggedInUser) {

      if (loggedInUser.permissions.includes(PERMISSIONS.CAN_MANAGE_SCHEMAS)) {
        menuItems.push(
          { label: 'Schemas', route: routes.schemas.index },
        );
        routeItems.push(
          {
            path: routes.schemas.index,
            component: SchemasList,
          },
        );
      }

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


      if (loggedInUser.permissions.includes(PERMISSIONS.CAN_VIEW_DOCUMENTS) || loggedInUser.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)) {
        menuItems.push({ label: 'Documents', route: routes.documents.index });

        // The order is important and the path are similar and routes will match first route it finds
        // documents/new can match documents/{id} if the routes is declared after
        if (loggedInUser.schemas.length) {
          routeItems.push(
            {
              path: routes.documents.new,
              component: CreateDocument,
            },
          );

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
          },
        );


      }

      menuItems.push({ label: 'Log out', route: routes.user.logout, external: true, secondary: true });

    }

    return (
      <div className="App">
        <AxisTheme full={true}>
          <NotificationProvider>
            <Box align="center">
              <ConnectedNotifications/>
              <Header
                user={loggedInUser}
                selectedRoute={selectedRoute}
                menuItems={menuItems.reverse()}
                push={push}
              />
              <Box
                justify="center"
                direction="row"
              >
                <Box width="xlarge">
                  <Routing routes={routeItems}/>
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
