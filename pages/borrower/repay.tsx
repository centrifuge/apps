import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import LoanRepay from '../../components/LoanRepay';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';

class RepayPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/borrower/repay?loanId=${loanId}`}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge">
          {loanId ? (
            <WithTinlake render={tinlake =>
              <LoanRepay tinlake={tinlake} loanId={loanId} />} />
          ) : (
              <Alert margin="medium" type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default RepayPage;
