import React, { FunctionComponent } from 'react';
import { Box } from 'grommet';
import { Route, Switch } from 'react-router';
import invoiceRoutes from '../invoices/routes';
import orderRoutes from '../orders/routes';
import contactsRoutes from '../contacts/routes';
import Invoices from '../invoices/Invoices';
import CreateInvoice from '../invoices/CreateInvoice';
import Orders from '../orders/Orders';
import Contacts from '../contacts/Contacts';

const Body: FunctionComponent = () => (
  <Box justify="center" direction="row" fill="true" background="#f9f9fa">
    <Box width="xlarge">
      <Switch>
        <Route path={invoiceRoutes.new} component={CreateInvoice} />
        <Route path={invoiceRoutes.base} component={Invoices} />
        <Route path={orderRoutes.base} component={Orders} />
        <Route path={contactsRoutes.base} component={Contacts} />
      </Switch>
    </Box>
  </Box>
);

Body.displayName = 'Body';

export default Body;
