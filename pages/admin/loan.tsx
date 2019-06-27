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
    return <AxisTheme full={true}><Box pad="large">
      <h1><Link href="/admin"><a>{'<-'}</a></Link>View NFT</h1>

      {this.props.loanId ? (
        <WithTinlake render={tinlake =>
          <LoanDetail tinlake={tinlake} loanId={this.props.loanId} />} />
      ) : (
        <Alert type="error">Please provide an ID</Alert>
      )}
    </Box></AxisTheme>;
  }
}

export default LoanPage;
