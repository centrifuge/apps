import * as React from 'react';
import { Box, FormField, Button } from 'grommet';
import { baseToDisplay, displayToBase } from 'tinlake';
import NumberInput from '../../../components/NumberInput';
import { Loan, setCeiling} from '../../../services/tinlake/actions';
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
  ceiling: string;
}

class LoanCeiling extends React.Component<Props, State> {

  componentWillMount() {
    const { loan } = this.props;
    this.setState({ ceiling: (loan.principal || '0')});
  }

  setCeiling  = async () => {
    const { ceiling } = this.state;
    const { loan, tinlake } = this.props;
    this.props.transactionSubmitted && this.props.transactionSubmitted(`Changing maximum borrow amount initiated. Please confirm the pending transactions in MetaMask. Processing may take a few seconds.`);
    try {
      const res = await setCeiling(tinlake, loan.loanId, ceiling);
      if (res && res.errorMsg) {
        console.log(res);
        this.props.responseReceived && this.props.responseReceived(null, `Changing maximum borrow amount failed. ${res.errorMsg}`);
        return;
      } 
      this.props.responseReceived && this.props.responseReceived(`Maximum borrow amount changed successfully.`, null);
      this.props.loadLoan && this.props.loadLoan(tinlake, loan.loanId);
    } catch(e) {
      this.props.responseReceived && this.props.responseReceived(null, `Changing maximum borrow amount failed. ${e}`);
      console.log(e);
    }
  }
  render() {
    const { ceiling  } = this.state;
    return <Box basis={'1/4'} gap="medium" margin={{ right: "large" }}>
      <Box gap="medium">
        <FormField label="Maximum borrow amount">
          <NumberInput value={baseToDisplay(ceiling, 18)} suffix=" DAI" precision={18} 
          onValueChange={({ value }) =>
          this.setState({ ceiling: displayToBase(value, 18)})}
        />
        </FormField>
      </Box>
      <Box align="start">
        <Button primary label="Set max borrow amount" onClick={this.setCeiling} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoan,transactionSubmitted, responseReceived })(LoanCeiling);

