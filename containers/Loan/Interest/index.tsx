import * as React from 'react';
import { Box, FormField, Button } from 'grommet';
import { feeToInterestRate, Loan } from 'tinlake';
import NumberInput from '../../../components/NumberInput';
import { setInterest } from '../../../services/tinlake/actions';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { loadLoan } from '../../../ducks/loans';
import { connect } from 'react-redux';

interface Props {
  loan: Loan;
  tinlake: any;
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
}

interface State {
  interestRate: string;
}

class LoanInterest extends React.Component<Props, State> {
  state: State = {
    interestRate: ''
  };

  componentDidMount() {
    const { loan } = this.props;
    this.setState({ interestRate: feeToInterestRate(loan.interestRate) });
  }

  setInterestRate = async () => {
    const { interestRate } = this.state;
    const { loan, tinlake } = this.props;
    this.props.transactionSubmitted && this.props.transactionSubmitted('Changing interest rate initiated. Please ' +
      'confirm the pending transactions. Processing may take a few seconds.');
    try {
      const res = await setInterest(tinlake, loan.loanId, loan.debt.toString(), interestRate);
      if (res && res.errorMsg) {
        this.props.responseReceived && this.props.responseReceived(null,
                                                                   `Changing interest rate failed. ${res.errorMsg}`);
        return;
      }
      this.props.responseReceived && this.props.responseReceived('Interest rate changed successfully.', null);
      this.props.loadLoan && this.props.loadLoan(tinlake, loan.loanId);
    } catch (e) {
      this.props.responseReceived && this.props.responseReceived(null, `Changing interest rate failed. ${e}`);
      console.error(e);
    }
  }

  render() {
    const { interestRate } = this.state;
    return <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Interest rate">
          <NumberInput value={interestRate} suffix=" %"
            onValueChange={({ value }) =>
              this.setState({ interestRate: value })}
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.setInterestRate} primary label="Set interest rate"/>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoan, transactionSubmitted, responseReceived })(LoanInterest);
