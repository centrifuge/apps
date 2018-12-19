import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';

import { Box, Image } from 'grommet';
import logo from '../logo.png';
import invoicesRoutes from '../invoices/routes';
import purchaseOrdersRoutes from '../purchaseorders/routes';
import contactsRoutes from '../contacts/routes';
import CentrifugeLink from '../components/Link';

const ImageSuppressedWarnings = Image as any;

const Header: FunctionComponent = () => (
  <Box
    direction="row"
    align="center"
    justify="between"
    width="xlarge"
    height="xsmall"
  >
    <Link label="Centrifuge" to="/" size="large">
      <ImageSuppressedWarnings src={logo} />
    </Link>
    <Box direction="row" gap="small" fill="true" justify="end">
      <CentrifugeLink label="Invoices" to={invoicesRoutes.index} />
      <CentrifugeLink label="Purchase orders" to={purchaseOrdersRoutes.index} />
      <CentrifugeLink label="Contacts" to={contactsRoutes.index} />
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
