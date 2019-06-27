import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';

class LoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    return <AxisTheme full={true}><div>
      <h1><Link href="/admin"><a>{'<-'}</a></Link>View NFT</h1>

      {this.props.loanId ? (
        <WithTinlake render={tinlake =>
          <LoanDetail tinlake={tinlake} loanId={this.props.loanId} />} />
      ) : (
        'Please provide an ID'
      )}
    </div></AxisTheme>;
  }
}

export default LoanPage;
