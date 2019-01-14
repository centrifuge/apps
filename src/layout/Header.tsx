import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';

import { Anchor, Box, Image, Text } from 'grommet';
import logo from '../logo.png';
import invoicesRoutes from '../invoices/routes';
import purchaseOrdersRoutes from '../purchaseOrders/routes';
import { ROUTES } from '../common/constants';
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
    <Box direction="row" gap="small" fill justify="end">
      <CentrifugeLink label="Invoices" to={invoicesRoutes.index} />
      <CentrifugeLink label="Purchase orders" to={purchaseOrdersRoutes.index} />
      <CentrifugeLink label="Contacts" to={contactsRoutes.index} />
      <Anchor href={ROUTES.USERS.logout}>
        <Box fill="vertical" justify="center">
          <Text size="small">Logout</Text>
        </Box>
      </Anchor>
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
