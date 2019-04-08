import React, { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';

import { Anchor, Box, Image, Text } from 'grommet';
import logo from './logo.png';
import invoicesRoutes from './invoices/routes';
import purchaseOrdersRoutes from './purchase-orders/routes';
import { ROUTES } from './common/constants';
import contactsRoutes from './contacts/routes';
import CentrifugeLink from './components/Link';

const ImageSuppressedWarnings = Image as any;

// TODO Replace this with NAVBAR component
const Header: FunctionComponent = () => (
  <Box
    justify="center"
    align="center"
    background="white"
    height="xsmall"
    fill="horizontal"
  >
    <Box
      direction="row"
      fill="vertical"
      align="center"
      justify="between"
      width="xlarge"
    >
      <Link label="Centrifuge" to="/" size="large">
        <ImageSuppressedWarnings src={logo} />
      </Link>
      <Box direction="row" gap="small" fill justify="end">
        <CentrifugeLink label="Invoices" to={invoicesRoutes.index} />
       {/*
       Disable purchase orders for now
       <CentrifugeLink
          label="Purchase orders"
          to={purchaseOrdersRoutes.index}
        />*/}
        <CentrifugeLink label="Contacts" to={contactsRoutes.index} />
        <Anchor href={ROUTES.USERS.logout}>
          <Box fill="vertical" justify="center">
            <Text size="small">Logout</Text>
          </Box>
        </Anchor>
      </Box>
    </Box>
  </Box>
);

Header.displayName = 'Header';

export default Header;
