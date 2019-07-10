import * as React from 'react';
import LoanList from '../../components/LoanList';
import Header, { MenuItem } from '../../components/Header';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/admin' },
];

class AdminLoanListPage extends React.Component {
  render() {
    return <Box align="center">
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
    </Box>;
  }
}

export default AdminLoanListPage;
