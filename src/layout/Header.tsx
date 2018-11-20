import React, { FunctionComponent } from 'react';

import { Box, Button } from 'grommet';
import Link from '../components/Link';

const Header: FunctionComponent = () => (
  <Box gridArea="header" direction="row" align="center" justify="between" width="xlarge">
    <Button>
      <Link label="Centrifuge" to="/" size="large" />
    </Button>
    <Box direction="row" gap="small">
      <Link label="Invoices" to="/invoices" />
      <Link label="Purchase orders" to="/orders" />
      <Link label="Contacts" to="/contacts" />
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
