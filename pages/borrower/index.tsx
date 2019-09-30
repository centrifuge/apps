import * as React from 'react';
import LoanList from '../../components/LoanList';
import WithTinlake from '../../components/WithTinlake';
import { Box, Heading } from 'grommet';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';
import SecondaryHeader from '../../components/SecondaryHeader';
import Auth from '../../components/Auth';
import Alert from '../../components/Alert';
import config from '../../config'

const { isDemo } = config

class BorrowerLoanListPage extends React.Component {

  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/borrower'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <Box>
              <SecondaryHeader>
                <Heading level="3">Loans</Heading>
              </SecondaryHeader>

              <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization render={auth =>
                auth.user === null && 
                  <Alert margin="medium" type="error">
                    Please authenticate to view your loans.
                  </Alert> ||
                auth.user && auth.isAdmin && !isDemo &&
                  <Alert margin="medium" type="error">
                    Please use a borrower account to access this page.
                  </Alert>
              } />
              <LoanList tinlake={tinlake} mode="borrower" />
            </Box>
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default BorrowerLoanListPage;
