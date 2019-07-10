import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';
import { AxisTheme } from '@centrifuge/axis-theme';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import Header, { MenuItem } from '../../components/Header';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/admin' },
];

class AdminLoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <AxisTheme full={true}>
      <Box align="center">
        <Header
          selectedRoute={`/admin/loan?loanId=${loanId}`}
          menuItems={menuItems.reverse()}
          section="ADMIN"
        />
        <Box
          justify="center"
          direction="row"
        >
          <Box width="xlarge" >
            {loanId ? (
              <WithTinlake render={tinlake =>
                <LoanDetail tinlake={tinlake} loanId={loanId} mode="admin" />} />
            ) : (
              <Alert type="error">Please provide an ID</Alert>
            )}
          </Box>
        </Box>
      </Box>
    </AxisTheme>;
  }
}

export default AdminLoanPage;
