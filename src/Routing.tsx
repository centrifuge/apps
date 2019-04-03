import React, { FunctionComponent } from 'react';
import { Route, Switch } from 'react-router';
import routes from './routes';
import Invoices from './invoices/View';
import CreateInvoice from './invoices/Create';
import EditInvoice from './invoices/Edit';
import PurchaseOrders from './purchase-orders/View';
import Contacts from './contacts/View';
import LoginPage from './user/Login';
import RegisterPage from './user/Register';
import ProtectedRoute from './components/ProtectedRoute';
import CreatePurchaseOrder from './purchase-orders/Create';
import EditPurchaseOrder from './purchase-orders/Edit';




const Routing: FunctionComponent = () => (
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
);

Routing.displayName = 'Body';

export default Routing;
