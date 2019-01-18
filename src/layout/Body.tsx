import React, { FunctionComponent } from 'react';
import { Box } from 'grommet';
import { Route, Switch } from 'react-router';
import routes from '../routes';
import Invoices from '../invoices/view';
import CreateInvoice from '../invoices/create';
import EditInvoice from '../invoices/edit';
import PurchaseOrders from '../purchaseOrders/view';
import Contacts from '../contacts/view';
import LoginPage from '../user/login';
import ProtectedRoute from '../components/ProtectedRoute';
import CreatePurchaseOrder from '../purchaseOrders/create';

const Body: FunctionComponent = () => (
  <Box
    justify="center"
    direction="row"
    fill
    background="bodyBackground"
    border="top"
  >
    <Box width="xlarge">
      <Switch>
        <ProtectedRoute path={routes.invoices.new} component={CreateInvoice} />
        <ProtectedRoute path={routes.invoices.update} component={EditInvoice} />
        <ProtectedRoute path={routes.invoices.index} component={Invoices} />
        <ProtectedRoute
          path={routes.purchaseOrders.new}
          component={CreatePurchaseOrder}
        />
        <ProtectedRoute
          path={routes.purchaseOrders.index}
          component={PurchaseOrders}
        />
        <ProtectedRoute path={routes.contacts.index} component={Contacts} />
        <Route path={routes.index} component={LoginPage} />
      </Switch>
    </Box>
  </Box>
);

Body.displayName = 'Body';

export default Body;
