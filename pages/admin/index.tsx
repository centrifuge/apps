import * as React from 'react';
import LoanList from '../../components/LoanList';
import Header, { MenuItem } from '../../components/Header';
import WithTinlake from '../../components/WithTinlake';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Box } from 'grommet';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/admin' },
];

class AdminLoanListPage extends React.Component {
  render() {
    return <AxisTheme full={true}>
      <Box align="center">
        <Header
          selectedRoute={'/admin'}
          menuItems={menuItems.reverse()}
          section="ADMIN"
        />
        <Box
          justify="center"
          direction="row"
        >
          <Box width="xlarge" >
            <WithTinlake render={tinlake => <LoanList tinlake={tinlake} mode="admin" />} />
          </Box>
        </Box>
      </Box>
    </AxisTheme>;
  }
}

export default AdminLoanListPage;
