import * as React from 'react';
import { AuthState } from '../../../ducks/auth';
import { InvestorState, loadInvestor } from '../../../ducks/investments';
import { connect } from 'react-redux';
import { Box, Tab, Tabs } from 'grommet';
import Alert from '../../../components/Alert';
import { Spinner } from '@centrifuge/axis-spinner';
import { isValidAddress } from '../../../utils/address';
import TrancheView from '../Tranche';
import { TransactionState, resetTransactionState } from '../../../ducks/transactions';
import { AnalyticsState, loadAnalyticsData } from '../../../ducks/analytics';

interface Props {
  tinlake: any;
  auth: AuthState;
  loadInvestor?: (tinlake: any, address: string) => Promise<void>;
  investments?: InvestorState;
  transactions?: TransactionState;
  resetTransactionState?: () => void;
  loadAnalyticsData?: (tinlake: any) => Promise<void>;
  analytics?: AnalyticsState;
  investorAddress: string;
}

interface State {
  errorMsg: string;
  is: string | null;
  selectedTab: number;
}

class InvestorView extends React.Component<Props, State> {

  showInvestor = async () => {
    const { investorAddress } = this.props;
    const { loadInvestor, tinlake } = this.props;
    resetTransactionState && resetTransactionState();
    this.setState({ is: null, errorMsg: '' });
    if (!isValidAddress(investorAddress)) {
      this.setState({ is: 'error', errorMsg: 'Please input a valid Ethereum address.' });
      return;
    }
    loadInvestor && loadInvestor(tinlake, investorAddress);
  }

  componentWillMount() {
    const { loadAnalyticsData, tinlake } = this.props;
    resetTransactionState()
    loadAnalyticsData && loadAnalyticsData(tinlake);
    this.showInvestor();
    this.setState({selectedTab: 0});
  }

  componentWillUnmount() {
   resetTransactionState()
  }

  resetTransactionState() {
    const { resetTransactionState } = this.props;
    resetTransactionState && resetTransactionState();
  }

  selectTab(tab : number) {
    const { selectedTab } = this.state;
    if (tab != selectedTab) {
      this.resetTransactionState()
    }
    this.setState({selectedTab: tab});
  }

  render() {
    const { is, errorMsg, selectedTab} = this.state;
    const { tinlake, investments, auth, analytics, transactions } = this.props;
    const investor = investments && investments.investor;
    const investorState = investments && investments.investorState;

    if (investorState && investorState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading Investor information...'} />;
    }
    
    return <Box>

      <Box pad={{ horizontal: 'medium' }}>
        {is === 'error' && <Alert type="error">
          {errorMsg && <div>{errorMsg}</div>}
        </Alert>}
      </Box>
      { analytics && analytics.data  &&
      <Box pad={{ horizontal: 'medium', top: 'large' }} >
        <Tabs justify="center" activeIndex={selectedTab} flex="grow" onActive={(i) => this.selectTab(i)}>
          <Tab title='Senior tranche / DROP token' style={{
            flex: 1,
            fontWeight: 900,
          }}>
            <TrancheView tinlake={tinlake} transactions={transactions} auth={auth} investor={investor} tranche={analytics.data["senior"]} />
          </Tab>
          <Tab title='Junior tranche / TIN token' style={{
            flex: 1,
            fontWeight: 900,
          }}
          >
            <TrancheView transactions={transactions} tinlake={tinlake} auth={auth} investor={investor} tranche={analytics.data["junior"]} />
          </Tab>
        </Tabs>
      </Box>
      }
    </Box>;
  }
}


export default connect(state => state, { loadInvestor, loadAnalyticsData, resetTransactionState })(InvestorView);
