import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import LoanRepay from '../../components/LoanRepay';

class RepayPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <AxisTheme full={true}><Box pad="large">
      <h1><Link href={`/borrower/loan?loanId=${loanId}`}><a>{'<-'}</a>
        </Link>Repay Loan {loanId}</h1>

      {loanId ? (
        <WithTinlake render={tinlake =>
          <LoanRepay tinlake={tinlake} loanId={loanId} />} />
      ) : (
        <Alert type="error">Please provide an ID</Alert>
      )}
    </Box></AxisTheme>;
  }
}

export default RepayPage;
