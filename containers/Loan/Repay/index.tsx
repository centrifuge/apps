import * as React from 'react';
import { Box, FormField, Button } from 'grommet';
import NumberInput from '../../../components/NumberInput';
import { repay } from '../../../services/tinlake/actions';
import { baseToDisplay, displayToBase, Loan } from 'tinlake';
import { transactionSubmitted, responseReceived } from '../../../ducks/transactions';
import { loadLoan } from '../../../ducks/loans';
import { connect } from 'react-redux';
import { ensureAuthed } from '../../../ducks/auth';

interface Props {
  loan: Loan;
  tinlake: any;
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>;
  transactionSubmitted?: (loadingMessage: string) => Promise<void>;
  responseReceived?: (successMessage: string | null, errorMessage: string | null) => Promise<void>;
  ensureAuthed?: () => Promise<void>;
}

interface State {
  repayAmount: string;
}

class LoanRepay extends React.Component<Props, State> {
  state: State = {
    repayAmount: '0'
  };

  componentDidMount() {
    const { loan } = this.props;
    this.setState({ repayAmount: (loan.debt && loan.debt.toString()) || '0' });
  }

  repay = async () => {
    try {
      await this.props.ensureAuthed!();
      const { transactionSubmitted, responseReceived, loadLoan, loan, tinlake } = this.props;
      // support partial repay later
      transactionSubmitted && transactionSubmitted('Repayment initiated. Please confirm the pending transactions. ' +
        'Processing may take a few seconds.');
      const res = await repay(tinlake, loan);
      if (res && res.errorMsg) {
        responseReceived && responseReceived(null, `Repayment failed. ${res.errorMsg}`);
        return;
      }
      responseReceived && responseReceived('Repayment successful. Please check your wallet.', null);
      loadLoan && loadLoan(tinlake, loan.loanId);
    } catch (e) {
      responseReceived && responseReceived(null, `Repayment failed. ${e}`);
      console.error(e);
    }
  }

  render() {
    const { repayAmount } = this.state;
    const { loan } = this.props;
    const hasDebt = loan.debt.toString() !== '0';

    return <Box basis={'1/4'} gap="medium" margin={{ right: 'large' }}>
      <Box gap="medium">
        <FormField label="Repay amount">
          <NumberInput value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18}
            onValueChange={({ value }) =>
              this.setState({ repayAmount: displayToBase(value, 18) })}
            disabled
          />
        </FormField>
      </Box>
      <Box align="start">
        <Button onClick={this.repay} primary label="Repay" disabled={!hasDebt} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoan, transactionSubmitted, responseReceived, ensureAuthed })(LoanRepay);
