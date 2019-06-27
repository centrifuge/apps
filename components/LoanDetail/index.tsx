import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';

interface Props {
  loanId: string;
  tinlake: Tinlake;
}

interface State {
}

class LoanDetail extends React.Component<Props, State> {
  state: State = {
  };

  render() {
    return <div>Loan ID {this.props.loanId}</div>;
  }
}

export default LoanDetail;
