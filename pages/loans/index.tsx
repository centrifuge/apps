import * as React from 'react';
import LoanList from '../../containers/Loan/List';
import WithTinlake from '../../components/WithTinlake';
import { Box, Heading, Button } from 'grommet';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';
import SecondaryHeader from '../../components/SecondaryHeader';
import Auth from '../../components/Auth';
import Alert from '../../components/Alert';
import Link from 'next/link';

class LoanListPage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/loans'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
              <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization
                render={auth => auth && auth.state === 'loaded' && auth.user ?
                  <Box>
                    <SecondaryHeader>
                      <Heading level="3">Loans</Heading>
                      <Link href={`/loans/issue`}>
                        <Button primary label="Open Loan" />
                      </Link>
                    </SecondaryHeader>
                    <LoanList tinlake={tinlake} auth={auth} />
                  </Box>
                  :
                  <Alert margin="medium" type="error">
                    Please authenticate to access this page </Alert>
              } />
          } />
        </Box>
      </Box>
    </Box>
  }
}
export default LoanListPage;
