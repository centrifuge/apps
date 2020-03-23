import * as React from 'react';
import { AuthState } from '../../../ducks/auth';
import { InvestorState, loadInvestor } from '../../../ducks/investments';
import { connect } from 'react-redux';
import { Box, FormField, TextInput, Button, Heading} from 'grommet';
import Alert from '../../../components/Alert';
import { Spinner } from '@centrifuge/axis-spinner';
import { isValidAddress } from '../../../utils/address';
import InvestorSupply from '../Supply';
import InvestorRedeem from '../Redeem';
import InvestorAllowance from '../Allowance';
import InvestorMetric from '../../../components/Investment/Metric';
import { TransactionState, resetTransactionState } from '../../../ducks/transactions';

interface Props {
  tinlake: any;
  auth: AuthState;
  loadInvestor?: (tinlake: any, address: string) => Promise<void>;
  investments?: InvestorState;
  transactions?: TransactionState;
  resetTransactionState?: () => void;
}

interface State {
  errorMsg: string;
  is: string;
  investorAddress: string;
}

class InvestmentView extends React.Component<Props, State> {

  showInvestor = async () => {
    const { investorAddress } = this.state;

    this.props.resetTransactionState && this.props.resetTransactionState();

    this.setState({ is: null, errorMsg: '' });
    if (!isValidAddress(investorAddress)) {
      this.setState({ is: "error", errorMsg: 'Please input a valid Ethereum address.' });
      return;
    }
    this.props.loadInvestor(this.props.tinlake, investorAddress);
  }

  componentWillMount() {
    this.setState({
      investorAddress: ""
    });
    this.props.resetTransactionState && this.props.resetTransactionState();
  }

  componentWillUnmount() {
    this.props.resetTransactionState && this.props.resetTransactionState();
  }

  render() {
    const { investorAddress, is, errorMsg } = this.state;
    const { tinlake, investments, auth, transactions } = this.props;

    const investor = investments && investments.investor;
    const investorState = investments && investments.investorState
    const isJuniorAdmin = auth.user && auth.user.permissions.canSetInvestorAllowanceJunior;
    const isInvestor = (auth.user && investor) && (auth.user.address.toLowerCase() === investor.address.toLowerCase());
   
    if (investorState && investorState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading Investor information...'} />;
    }

    if (transactions && transactions.transactionState && transactions.transactionState === 'processing') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={transactions.loadingMessage || 'Processing Transaction. This may take a fev seconds. Please wait...'} />;
    }

    return <Box>

      {transactions && transactions.successMessage &&
      <Box pad={{ horizontal: 'medium' }} margin={{ bottom: "large" }}>
          <Alert type="success">
            {transactions.successMessage} </Alert>
      </Box>}

      {transactions && transactions.errorMessage &&
      <Box pad={{ horizontal: 'medium' }} margin={{ bottom: "large" }}>
          <Alert type="error">
            {transactions.errorMessage}
          </Alert>
      </Box>}

      <Box pad={{ horizontal: 'medium' }}>
        {is === 'error' && <Alert type="error">
          {errorMsg && <div>{errorMsg}</div>}
        </Alert>}
      </Box>

      <Box pad={{ horizontal: 'medium' }}>
        <Box direction="row" gap="medium" margin={{ top: 'medium' }}>
          <b>Please paste the investor address below to load investor details:</b>
        </Box>
      </Box>

      <Box pad={{ horizontal: 'medium' }} >
        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/3'} gap="medium">
            <FormField label="Investor Address">
              <TextInput
                value={investorAddress}
                onChange={(event) =>
                  this.setState({ investorAddress: event.currentTarget.value })}
              />
            </FormField>
          </Box>
          <Box gap="medium" align="end">
            <Button onClick={this.showInvestor} primary label="Load investor details" disabled={is === 'loading' || !isValidAddress(investorAddress)} />
          </Box>
        </Box>
      </Box>

      {is !== 'error' && investorState && investorState === 'found' && investor && investor.address === investorAddress &&
        <Box>
          <Box pad={{ horizontal: 'medium' }} margin={{ top: "large", bottom: "large" }} >
            <Box>
              <InvestorMetric investor={investor} />
            </Box>
          </Box>

          {isJuniorAdmin &&
            <Box pad={{ horizontal: 'medium' }} margin={{ top: "large", bottom: "large" }} >
              <Box>
                <Box gap="medium" align="start" margin={{ bottom: "medium" }} >
                  <Heading level="5" margin="none"> Set Junior allowance </Heading>
                </Box>
                <InvestorAllowance tinlake={tinlake} investor={investor} />
              </Box>
            </Box>
          }

          {isInvestor &&
            <Box pad={{ horizontal: 'medium' }} margin={{ top: "large", bottom: "large" }} >
              <Box gap="medium" align="start" margin={{ bottom: "medium" }} >
                <Heading level="5" margin="none">Supply / Redeem </Heading>
              </Box>

              <Box direction="row">
                <InvestorSupply investor={investor!} tinlake={tinlake}> </InvestorSupply>
                <InvestorRedeem investor={investor!} tinlake={tinlake}> </InvestorRedeem>
              </Box>
            </Box>
          }
        </Box>
      }

    </Box>
  }
}


export default connect(state => state, { loadInvestor, resetTransactionState })(InvestmentView);
