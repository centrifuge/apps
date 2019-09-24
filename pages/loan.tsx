import * as React from 'react';
import WithTinlake from '../components/WithTinlake';
import LoanDetail from '../components/LoanDetail';
import Alert from '../components/Alert';
import { Box } from 'grommet';
import Header from '../components/Header';
import { menuItems } from '../menuItems';

class LoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/loan?loanId=${loanId}`}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          {loanId ? (
            <WithTinlake render={tinlake =>
                <LoanDetail tinlake={tinlake} loanId={loanId} mode={''} />
            } />
          ) : (
              <Alert margin="medium" type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default LoanPage;
