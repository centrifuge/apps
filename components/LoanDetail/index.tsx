import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: number) => Promise<void>;
}

class LoanDetail extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, parseInt(this.props.loanId, 10));
  }

  render() {
    const { loans, loanId } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return 'loading'; }
    if (singleLoanState === 'not found') {
      return <Alert type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, principal, price, debt, tokenId, registry } = singleLoan!;

    return <div>
      <div>Loan ID {loanId}</div>
      <div>Loan Status {status}</div>
      <div>Appraisal Amount</div>
      <div>Principal Amount {principal.toString()}</div>
      <div>Debt {debt.toString()}</div>
      <div>Interest Rate {price.toString()}</div>
      <div>NFT ID {tokenId.toString()}</div>
      <div>NFT Owner {registry.toString()}</div>
      <div>Mortgage ID TBD</div>
      <div>Mortgage Amount TBD</div>
      <div>Currency TBD</div>
      <div>Maturity Date TBD</div>
    </div>;
  }
}

export default connect(state => state, { getLoan })(LoanDetail);
