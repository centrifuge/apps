import React from 'react';

import { Box, Button, Text } from 'grommet';

export default () => (
  <Box
    gridArea="header"
    direction="row"
    align="center"
    justify="between"
    pad={{ horizontal: 'medium', vertical: 'small' }}
    background="white"
  >
    <Button>
      <Text size="large">Centrifuge</Text>
    </Button>
    <Box direction="row">
      <Box pad={{ horizontal: 'small' }}>
        <Button>
          <Text>Invoices</Text>
        </Button>
      </Box>
      <Box pad={{ horizontal: 'small' }}>
        <Button>
          <Text>Purchase orders</Text>
        </Button>
      </Box>
      <Box pad={{ horizontal: 'small' }}>
        <Button>
          <Text>Contacts</Text>
        </Button>
      </Box>
    </Box>
  </Box>
);
