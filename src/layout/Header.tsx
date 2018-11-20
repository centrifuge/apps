import React, { FunctionComponent } from 'react';

import { Box, Button } from 'grommet';
import invoicesRoutes from '../invoices/routes';
import ordersRoutes from '../orders/routes';
import contactsRoutes from '../contacts/routes';
import Link from '../components/Link';

const Header: FunctionComponent = () => (
  <Box direction="row" align="center" justify="between" width="xlarge">
    <Button>
      <Link label="Centrifuge" to="/" size="large" />
    </Button>
    <Box direction="row" gap="small">
      <Link label="Invoices" to={invoicesRoutes.base} />
      <Link label="Purchase orders" to={ordersRoutes.base} />
      <Link label="Contacts" to={contactsRoutes.base} />
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
