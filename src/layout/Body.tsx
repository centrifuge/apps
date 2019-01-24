import React, { FunctionComponent } from 'react';
import { Box } from 'grommet';
import { Route, Switch } from 'react-router';
import routes from '../routes';
import Invoices from '../invoices/view';
import CreateInvoice from '../invoices/create';
import EditInvoice from '../invoices/edit';
import PurchaseOrders from '../purchase-orders/view';
import Contacts from '../contacts/view';
import LoginPage from '../user/login';
import RegisterPage from '../user/register';
import ProtectedRoute from '../components/ProtectedRoute';
import CreatePurchaseOrder from '../purchase-orders/create';
import EditPurchaseOrder from '../purchase-orders/edit';

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
          path={routes.purchaseOrders.update}
          component={EditPurchaseOrder}
        />
        <ProtectedRoute
          path={routes.purchaseOrders.index}
          component={PurchaseOrders}
        />
        <ProtectedRoute path={routes.contacts.index} component={Contacts} />
        <Route path={routes.user.register} component={RegisterPage} />
        <Route path={routes.index} component={LoginPage} />
      </Switch>
    </Box>
  </Box>
);

Body.displayName = 'Body';

export default Body;
