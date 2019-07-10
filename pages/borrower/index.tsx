import * as React from 'react';
import LoanList from '../../components/LoanList';
import WithTinlake from '../../components/WithTinlake';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Box } from 'grommet';
import Header, { MenuItem } from '../../components/Header';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/borrower' },
];

class BorrowerLoanListPage extends React.Component {
  render() {
    return <AxisTheme full={true}>
      <Box align="center">
        <Header
          selectedRoute={'/borrower'}
          menuItems={menuItems.reverse()}
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
      </Box>
    </AxisTheme>;
  }
}

export default BorrowerLoanListPage;
