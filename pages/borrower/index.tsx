import * as React from 'react';
import LoanList from '../../components/LoanList';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';

class BorrowerLoanListPage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/borrower'}
        menuItems={menuItems}
        section="BORROWER"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake => <LoanList tinlake={tinlake} mode="borrower" />} />
        </Box>
      </Box>
    </Box>;
  }
}

export default BorrowerLoanListPage;
