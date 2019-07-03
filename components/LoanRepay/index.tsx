import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, TextInput, Button } from 'grommet';
import LoanNftData from '../LoanNftData.tsx';
// tslint:disable-next-line:import-name
import BN from 'bn.js';
import { bnToHex } from '../../utils/bnToHex';

const SUCCESS_STATUS = '0x1';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: number) => Promise<void>;
}

interface State {
  repayAmount: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

class LoanRepay extends React.Component<Props, State> {
  state: State = {
    repayAmount: '',
    is: null,
    errorMsg: '',
  };

  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, parseInt(this.props.loanId, 10));
  }

  componentDidUpdate(nextProps: Props) {
    const loans = nextProps.loans;
    if (!loans || !loans.singleLoan) { return; }
    const nextDebt = loans.singleLoan.debt.toString();
    if (nextDebt !== this.state.repayAmount) {
      this.setState({ repayAmount: loans.singleLoan.debt.toString() });
    }
  }

  repay = async () => {
    this.setState({ is: 'loading' });

    const { tinlake, loanId } = this.props;
    const { repayAmount } = this.state;
    const addresses = tinlake.contractAddresses;
    const ethFrom = tinlake.ethConfig.from;

    try {
      // approve currency
      const res0 = await tinlake.approveCurrency(addresses['PILE'], repayAmount);
      console.log(res0.txHash);

      if (res0.status !== SUCCESS_STATUS || res0.events[0].event.name !== 'Approval') {
        console.log(res0);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res0) });
        return;
      }

      // repay
      const res1 = await tinlake.repay(loanId, repayAmount, ethFrom,
                                       ethFrom);

      console.log('admit result');
      console.log(res1.txHash);

      if (res1.status !== SUCCESS_STATUS) {
        console.log(res1);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res1) });
        return;
      }

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { loans, loanId, tinlake } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return 'Loading...'; }
    if (singleLoanState === 'not found') {
      return <Alert type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, price, loanOwner } = singleLoan!;
    const { repayAmount, is, errorMsg } = this.state;
    const totalAmount = price.add(new BN(repayAmount));

    return <Box>
      {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from &&
        <Button primary onClick={this.repay}>Confirm</Button>}

      {is === 'loading' && 'Repaying...'}
      {is === 'success' && <Alert type="success" margin={{ top: 'large' }}>
        Successfully repayed {repayAmount.toString()} for Loan ID {loanId}</Alert>}
      {is === 'error' && <Alert type="error" margin={{ top: 'large' }}>
        <strong>Error repaying Loan ID {loanId}, see console for details</strong>
        {errorMsg && <div><br />{errorMsg}</div>}
      </Alert>}

      <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="Repay Amount">
          <TextInput
            value={repayAmount} disabled
            onChange={e => this.setState({ repayAmount: e.currentTarget.value }) }
          /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Interest Amount">
          <TextInput value={price.toString()} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Total Amount">
          <TextInput value={totalAmount.toString()} disabled /></FormField></Box>
      </Box>

      <LoanNftData loan={singleLoan!} />
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanRepay);
