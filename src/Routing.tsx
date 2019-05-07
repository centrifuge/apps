import React, { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import routes from './routes';
import InvoiceList from './invoices/InvoiceList';
import CreateInvoice from './invoices/Create';
import EditInvoice from './invoices/Edit';
import Contacts from './contacts/View';
import LoginPage from './user/Login';
import RegisterPage from './user/Register';
import UsersList from './admin/users/UsersList';
import { User } from './common/models/user';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ConnectedInvoiceDetails } from './invoices/InvoiceDetails';

interface RoutingProps {
  loggedInUser: User | null;
}

const Routing: FunctionComponent<RoutingProps> = (props) => {
    //TODO remove this when store is injected from middleware
    // Hack to not login every time
    const authorized = process.env.NODE_ENV === 'development' ? true : !!props.loggedInUser;
    return (
      <Switch>
        <Route exact path={routes.index} component={LoginPage}/>
        <Route exact path={routes.user.register} component={RegisterPage}/>
        <ProtectedRoute exact path={routes.user.index} component={UsersList} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.new} component={CreateInvoice} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.view} component={ConnectedInvoiceDetails} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.edit} component={EditInvoice} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.index} component={InvoiceList} authorized={authorized}/>
        <ProtectedRoute exact path={routes.contacts.index} component={Contacts} authorized={authorized}/>
        <Redirect to={routes.index}/>
      </Switch>
    );
  }
;

Routing.displayName = 'Body';
export default Routing;

