import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import Header from '../../components/Header';
import Auth from '../../components/Auth';
import { menuItems } from '../../menuItems';

class AdminLoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/admin/loan?loanId=${loanId}`}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          {loanId ? (
            <WithTinlake render={tinlake =>
              <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization
                render={auth => auth.isAdmin ?
                  <LoanDetail tinlake={tinlake} loanId={loanId} mode="admin" />
                  :
                  <Alert margin="medium" type="error">
                    Please use an admin account to access this page</Alert>
                } />
            } />
          ) : (
              <Alert margin="medium" type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default AdminLoanPage;
