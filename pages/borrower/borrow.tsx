import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import LoanBorrow from '../../components/LoanBorrow';
import Header, { MenuItem } from '../../components/Header';

const menuItems: MenuItem[] = [
  { label: 'Loans', route: '/borrower' },
];

class BorrowPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/borrower/borrow?loanId=${loanId}`}
        menuItems={menuItems.reverse()}
        section="BORROWER"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge">
          {loanId ? (
            <WithTinlake render={tinlake =>
              <LoanBorrow tinlake={tinlake} loanId={loanId} />} />
          ) : (
              <Alert type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default BorrowPage;
