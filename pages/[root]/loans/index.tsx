import * as React from 'react';
import LoanList from '../../../containers/Loan/List';
import WithTinlake from '../../../components/WithTinlake';
import { Box, Heading, Button } from 'grommet';
import Header from '../../../components/Header';
import { menuItems } from '../../../menuItems';
import SecondaryHeader from '../../../components/SecondaryHeader';
import Auth from '../../../components/Auth';
import { PoolLink } from '../../../components/PoolLink';

class LoanListPage extends React.Component {
  render() {
    return <Box pad={{ horizontal: 'small' }} >
      <Header
        selectedRoute={'/loans'}
        menuItems={menuItems}
      />
      <Box
        justify="evenly"
        direction="row"
      >
        <Box width="xlarge" gap="medium" >
          <WithTinlake render={tinlake =>
              <Auth tinlake={tinlake}
                render={auth =>
                  <Box>
                    <SecondaryHeader>
                      <Heading level="3">Loans</Heading>
                      <PoolLink href={'/loans/issue'}>
                        <Button primary label="Open Loan" />
                      </PoolLink>
                    </SecondaryHeader>
                    <LoanList tinlake={tinlake} auth={auth} />
                  </Box>
              } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}
export default LoanListPage;
