import React, { FunctionComponent } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import routes from './routes';
import Invoices from './invoices/View';
import CreateInvoice from './invoices/Create';
import EditInvoice from './invoices/Edit';
import Contacts from './contacts/View';
import LoginPage from './user/Login';
import RegisterPage from './user/Register';
import { User } from './common/models/user';
import { ProtectedRoute } from './components/ProtectedRoute';


interface RoutingProps {
  loggedInUser: User | null;
}

const Routing: FunctionComponent<RoutingProps> = (props) => {
    const authorized = !!props.loggedInUser;
    return (
      <Switch>
        <ProtectedRoute exact path={routes.user.register} component={RegisterPage} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.new} component={CreateInvoice} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.update} component={EditInvoice} authorized={authorized}/>
        <ProtectedRoute exact path={routes.invoices.index} component={Invoices} authorized={authorized}/>
        <ProtectedRoute exact path={routes.contacts.index} component={Contacts} authorized={authorized}/>
        <Route exact path={routes.index} component={LoginPage}/>
        <Redirect to={routes.index}/>
      </Switch>
    );
  }
;

Routing.displayName = 'Body';
export default Routing

