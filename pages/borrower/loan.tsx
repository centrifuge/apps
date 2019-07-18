import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import Header, { MenuItem } from '../../components/Header';
import Auth from '../../components/Auth';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/borrower' },
];

class BorrowerLoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/borrower/loan?loanId=${loanId}`}
        menuItems={menuItems.reverse()}
        section="BORROWER"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          {loanId ? (
            <WithTinlake render={tinlake =>
              <Auth tinlake={tinlake} requireAuthentication={false} render={() =>
                <LoanDetail tinlake={tinlake} loanId={loanId} mode="borrower" />
              } />
            } />
          ) : (
              <Alert type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default BorrowerLoanPage;
