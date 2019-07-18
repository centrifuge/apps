import * as React from 'react';
import LoanList from '../../components/LoanList';
import Header, { MenuItem } from '../../components/Header';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';
import AdminSwitch from '../../components/AdminSwitch';
import Alert from '../../components/Alert';

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
          <WithTinlake render={tinlake =>
            <AdminSwitch tinlake={tinlake} render={isAdmin => isAdmin ?
              <LoanList tinlake={tinlake} mode="admin" />
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
