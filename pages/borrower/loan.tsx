import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';
import Alert from '../../components/Alert';
import { Box } from 'grommet';

class LoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <AxisTheme full={true}><Box pad="large">
      <h1><Link href="/borrower"><a>{'<-'}</a></Link>View Loan {loanId}</h1>

      {loanId ? (
        <WithTinlake render={tinlake =>
          <LoanDetail tinlake={tinlake} loanId={loanId} />} />
      ) : (
        <Alert type="error">Please provide an ID</Alert>
      )}
    </Box></AxisTheme>;
  }
}

export default LoanPage;
