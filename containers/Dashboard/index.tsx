import * as React from 'react';
import { connect } from 'react-redux';
import { Box, Heading } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';
import { AnalyticsState } from '../../ducks/analytics';
import { LoansState, loadLoans } from '../../ducks/loans';
import { AuthState, loadUserProxies } from '../../ducks/auth';
import { Spinner } from '@centrifuge/axis-spinner';
import LoanListData from  '../../components/Loan/List';

interface Props {
  tinlake: any;
  loans?: LoansState;
  loadLoans?: (tinlake: any) => Promise<void>;
  analytics?: AnalyticsState;
  auth?: AuthState;
  loadUserProxies?: (address: string) => Promise<void>;
}

class Dashboard extends React.Component<Props> {

  componentWillMount() {
    const { loadLoans, tinlake, loadUserProxies } = this.props
    loadLoans && loadLoans(tinlake);
    loadUserProxies && loadUserProxies(tinlake.ethConfig.from);
  }
  
  render() {
    const { tinlake, loans, auth } = this.props;
    const userAddress = auth && auth.user && auth.user.address || tinlake.ethConfig.from;
    const proxies = auth && auth.user && auth.user.proxies || []

    return <Box >
      <SecondaryHeader>
          <Heading level="3">Loans</Heading>
      </SecondaryHeader>
      { (loans!.loansState === 'loading') ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />  :
        <LoanListData loans={loans!.loans} proxies={proxies} userAddress={userAddress}> </LoanListData>
      }

      <Box pad={{ vertical: 'medium' }}>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoans, loadUserProxies })(Dashboard);
