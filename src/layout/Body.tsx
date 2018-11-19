import React, { FunctionComponent } from 'react';
import { Box } from 'grommet';
import { Route, Switch } from 'react-router';
import routes from '../routes';
import Invoices from '../invoices/Invoices';
import Orders from '../orders/Orders';
import Contacts from '../contacts/Contacts';

const Body: FunctionComponent = () => (
  <Box gridArea="main" justify="center" align="center" direction="row">
    <Switch>
      <Route path={routes.invoices} component={Invoices} />
      <Route path={routes.orders} component={Orders} />
      <Route path={routes.contacts} component={Contacts} />
    </Switch>
  </Box>
);

Body.displayName = 'Body';

export default Body;
