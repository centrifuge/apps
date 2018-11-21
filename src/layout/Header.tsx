import React, { FunctionComponent } from 'react';

import { Box, Button } from 'grommet';
import invoicesRoutes from '../invoices/routes';
import purchaseOrdersRoutes from '../purchaseorders/routes';
import contactsRoutes from '../contacts/routes';
import Link from '../components/Link';

const Header: FunctionComponent = () => (
  <Box direction="row" align="center" justify="between" width="xlarge">
    <Button>
      <Link label="Centrifuge" to="/" size="large" />
    </Button>
    <Box direction="row" gap="small">
      <Link label="Invoices" to={invoicesRoutes.index} />
      <Link label="Purchase orders" to={purchaseOrdersRoutes.index} />
      <Link label="Contacts" to={contactsRoutes.index} />
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
