import * as React from 'react';
import Tinlake, { baseToDisplay, displayToBase } from 'tinlake';
import { LoansState, getLoan, subscribeDebt } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, Button, Heading, Text } from 'grommet';
import NftData from '../NftData';
import SecondaryHeader from '../SecondaryHeader';
import { BackLink } from '../BackLink';
import NumberInput from '../NumberInput';
import NumberDisplay from '../NumberDisplay';
import LoanData from '../LoanData';
import { calcRepayAmount } from '../../utils/calcRepayAmount';
import { authTinlake } from '../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import Auth from '../Auth';
import config from '../../config'
import BN from 'bn.js';
const { isDemo } = config
const SUCCESS_STATUS = '0x1';

const playgroundDAIAmount = '100';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: string, refresh?: boolean) => Promise<void>;
  subscribeDebt?: (tinlake: Tinlake, loanId: string) => () => void;
}

interface State {
  repayAmount: string;
  is: 'loading' | 'success' | 'error' | 'funded' | null;
  errorMsg: string;
  touchedRepaymentAmount: boolean;
}

class LoanRepay extends React.Component<Props, State> {
  state: State = {
    repayAmount: '',
    is: null,
    errorMsg: '',
    touchedRepaymentAmount: false
  };
  discardDebtSubscription = () => { };

  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, this.props.loanId);
    // this.discardDebtSubscription = this.props.subscribeDebt!(this.props.tinlake, this.props.loanId);
  }

  componentWillUnmount() {
    // this.discardDebtSubscription();
  }

  componentDidUpdate(nextProps: Props) {
    const loans = nextProps.loans;
    if (!loans || !loans.singleLoan) { return; }
    if (this.state.touchedRepaymentAmount) { return; }

    const { debt, fee } = loans.singleLoan;

    const repayAmount = calcRepayAmount(debt, fee).toString();

    if (repayAmount === this.state.repayAmount) { return; }

    this.setState({ repayAmount });
  }

  fundWallet = async () => {
    this.setState({ is: 'loading' });
    try {
      await authTinlake();
      const { tinlake } = this.props;
      const ethFrom = tinlake.ethConfig.from;
      const amount = (new BN( displayToBase(playgroundDAIAmount, 18))).toString();
      const res = await tinlake.mintCurrency(ethFrom, amount);
      if (res.status !== SUCCESS_STATUS || res.events[0].event.name !== 'Transfer') {
        this.setState({ is: 'error', errorMsg: JSON.stringify(res) });
        return;
      }

      this.setState({ is: 'funded' });
    } catch(e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }

  }
  repay = async () => {
    this.setState({ is: 'loading', touchedRepaymentAmount: true });

    try {
      await authTinlake();

      const { getLoan, tinlake, loanId } = this.props;
      const { repayAmount } = this.state;
      const addresses = tinlake.contractAddresses;
      const ethFrom = tinlake.ethConfig.from;
      const res0 = await tinlake.approveCurrency(addresses['PILE'], repayAmount);

      if (res0.status !== SUCCESS_STATUS || res0.events[0].event.name !== 'Approval') {
        this.setState({ is: 'error', errorMsg: JSON.stringify(res0) });
        return;
      }

      // const res1 = await tinlake.repay(loanId, repayAmount, ethFrom);
      const res1 = await tinlake.close(loanId, ethFrom);
      if (res1.status !== SUCCESS_STATUS) {
        this.setState({ is: 'error', errorMsg: JSON.stringify(res1) });
        return;
      }

      await getLoan!(tinlake, loanId, true);
      this.setState({ is: 'success' });

    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { loans, loanId, tinlake } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return null; }
    if (singleLoanState === 'not found') {
      return <Alert margin="medium" type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, loanOwner } = singleLoan!;
    const { repayAmount, is, errorMsg } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <BackLink href={`/borrower/loan?loanId=${loanId}`} />
          <Heading level="3">Repay Loan {loanId}</Heading>
        </Box>

        <Box direction="row" gap="small" align="center">
          {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from && isDemo &&
              <Button primary onClick={this.fundWallet} label="Fund Wallet" disabled = {is === 'loading' || is === 'funded'} />
          }

          {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from &&
            <Button primary onClick={this.repay} label="Confirm"
              disabled={is === 'loading' || is === 'success'} />}
        </Box> 
      </SecondaryHeader>

      <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization render={auth =>
        auth.user === null &&
          <Alert margin="medium" type="error">Please authenticate to view your loan.</Alert>
      } />

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Initiating the repayment process. Please confirm the pending transactions in MetaMask, and do not leave this page until all transactions have been confirmed.'} />
      :
        <Box pad={{ horizontal: 'medium' }}>
          {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from &&
            <Box direction="row" justify="end" margin={{ bottom: 'medium' }}>
              <Box>
                <Text alignSelf="end">
                    Your total Repayment Amount is <Text weight="bold">{<NumberDisplay
                    value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18} />}</Text>
                </Text>
                { isDemo &&
                <Text>
                  Please make sure your wallet is funded with playground DAI to cover loan fees.
                </Text>}
              </Box>
            </Box>
          }

          {is === 'success' && <Alert type="success" margin={{ vertical: 'large' }}><Text>
            Successfully repayed{' '}
            <NumberDisplay value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18} />
            {' '}for Loan ID {loanId}
          </Text></Alert>}
          {is === 'funded' && <Alert type="success" margin={{ vertical: 'large' }}><Text>
            Successfully received 100 playground DAI. Please confirm the repayment now.
          </Text></Alert>}
          {is === 'error' && <Alert type="error" margin={{ vertical: 'large' }}>
            <Text weight="bold">Error repaying Loan ID {loanId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}

          <Box direction="row" gap="medium" margin={{ vertical: 'medium' }}>
            <Box basis={'1/4'} gap="medium"><FormField label="Repay Amount">
              <NumberInput
                value={baseToDisplay(repayAmount, 18)} suffix=" DAI" precision={18}
                onValueChange={({ value }) => this.setState({
                  repayAmount: displayToBase(value, 18), touchedRepaymentAmount: true })}
                autoFocus disabled={true || is === 'loading' || is === 'success'}
              />
            </FormField></Box>
            <Box basis={'1/4'} gap="medium" />
            <Box basis={'1/4'} gap="medium" />
            <Box basis={'1/4'} gap="medium" />
          </Box>

          <LoanData loan={singleLoan!} />

          <NftData data={singleLoan!} authedAddr={tinlake.ethConfig.from} />
        </Box>
      }
    </Box>;
  }
}

export default connect(state => state, { getLoan, subscribeDebt })(LoanRepay);
