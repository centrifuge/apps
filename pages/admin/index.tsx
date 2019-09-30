import * as React from 'react';
import LoanList from '../../components/LoanList';
import Header from '../../components/Header';
import WithTinlake from '../../components/WithTinlake';
import { Box, Heading, Button } from 'grommet';
import Alert from '../../components/Alert';
import Auth from '../../components/Auth';
import { menuItems } from '../../menuItems';
import SecondaryHeader from '../../components/SecondaryHeader';
import Link from 'next/link';

class AdminLoanListPage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/admin'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization
              render={auth => auth.isAdmin ?
                <Box>
                  <SecondaryHeader>
                    <Heading level="3">Loans</Heading>

                    <Link href={'/admin/whitelist-nft'}>
                      <Button primary label="Whitelist NFT" /></Link>
                  </SecondaryHeader>

                  <LoanList tinlake={tinlake} mode="admin" />
                </Box>
                :
                <Alert margin="medium" type="error">
                  Please use an admin account to access this page</Alert>
              } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default AdminLoanListPage;
