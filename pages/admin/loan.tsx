import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import LoanDetail from '../../components/LoanDetail';

class LoanPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    return <div>
      <h1>View NFT</h1>

      {this.props.loanId ? (
        <WithTinlake render={tinlake =>
          <LoanDetail tinlake={tinlake} loanId={this.props.loanId} />} />
      ) : (
        'Please provide an ID'
      )}
    </div>;
  }
}

export default LoanPage;
