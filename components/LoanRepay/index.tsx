import * as React from 'react';
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, Button, Heading, Text } from 'grommet';
import LoanNftData from '../LoanNftData';
import BN from 'bn.js';
import SecondaryHeader from '../SecondaryHeader';
import Link from 'next/link';
import { LinkPrevious } from 'grommet-icons';
import { NumberInput } from '@centrifuge/axis-number-input';
import NumberDisplay from '../NumberDisplay';
import { baseToDisplay } from '../../utils/baseToDisplay';
import { displayToBase } from '../../utils/displayToBase';
import LoanData from '../LoanData';

const SUCCESS_STATUS = '0x1';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: string) => Promise<void>;
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
  lastDebt = '';

  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, this.props.loanId);
  }

  componentDidUpdate(nextProps: Props) {
    const loans = nextProps.loans;
    if (!loans || !loans.singleLoan) { return; }
    const nextDebt = loans.singleLoan.debt.toString();
    if (nextDebt !== this.lastDebt) {
      this.lastDebt = nextDebt;
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

    const { status, fee, loanOwner } = singleLoan!;
    const { repayAmount, is, errorMsg } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href={`/borrower/loan?loanId=${loanId}`}>
            <LinkPrevious />
          </Link>
          <Heading level="3">Repay Loan {loanId}</Heading>
        </Box>

        {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from &&
          <Button primary onClick={this.repay} label="Confirm" />}
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <Box direction="row" justify="end" margin={{ bottom: 'medium' }}>
          <Text>
            Your total Repayment Amount is <Text weight="bold">{<NumberDisplay
              value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18} />}</Text>
          </Text>
        </Box>

        {is === 'loading' && 'Repaying...'}
        {is === 'success' && <Alert type="success" margin={{ vertical: 'large' }}>
          Successfully repayed
          <NumberDisplay value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18} />
          for Loan ID {loanId}</Alert>}
        {is === 'error' && <Alert type="error" margin={{ vertical: 'large' }}>
          <Text weight="bold">Error repaying Loan ID {loanId}, see console for details</Text>
          {errorMsg && <div><br />{errorMsg}</div>}
        </Alert>}

        <Box direction="row" gap="medium" margin={{ vertical: 'medium' }}>
          <Box basis={'1/4'} gap="medium"><FormField label="Repay Amount">
            <NumberInput
              value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18}
              onChange={(masked: string, float: number) => float !== undefined &&
                this.setState({ repayAmount: displayToBase(masked, 18) })}
              autoFocus disabled
            />
          </FormField></Box>
          <Box basis={'1/4'} gap="medium" />
          <Box basis={'1/4'} gap="medium" />
          <Box basis={'1/4'} gap="medium" />
        </Box>

        <LoanData loan={singleLoan!} />

        <LoanNftData loan={singleLoan!} authedAddr={tinlake.ethConfig.from} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanRepay);
