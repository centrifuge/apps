import * as React from 'react';
import LoanList from '../../components/LoanList';
import WithTinlake from '../../components/WithTinlake';

class LoanListPage extends React.Component {
  render() {
    return <div>
      <h1>NFTs</h1>
      <WithTinlake render={tinlake => <LoanList tinlake={tinlake} />} />;
    </div>;
  }
}

export default LoanListPage;
