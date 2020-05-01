import * as React from 'react';
import { Box } from 'grommet';
import { connect } from 'react-redux';
import { LoansState, loadLoans } from '../../../ducks/loans';
import { AnalyticsState, loadAnalyticsData } from '../../../ducks/analytics';
import { baseToDisplay } from 'tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import { AuthState, loadUserProxies } from '../../../ducks/auth';
import LoanListData from '../../../components/Loan/List';
import NumberDisplay from '../../../components/NumberDisplay';
import DashboardMetric from '../../../components/DashboardMetric';
import { Loan } from '../../../services/tinlake/actions';

interface Props {
  tinlake: any;
  loans?: LoansState;
  loadLoans?: (tinlake: any) => Promise<void>;
  loadAnalyticsData?: (tinlake: any) => Promise<void>;
  loadUserProxies?: (address: string) => Promise<void>;
  auth: AuthState;
  analytics?: AnalyticsState
}

class LoanList extends React.Component<Props> {
  componentWillMount() {
    const { loadLoans, loadAnalyticsData, loadUserProxies, auth, tinlake } = this.props
    loadLoans && loadLoans(tinlake);
    loadAnalyticsData && loadAnalyticsData(tinlake);
    loadUserProxies && auth && auth.user && loadUserProxies(auth.user.address);
  }

  render() {
    const { loans, analytics, auth, tinlake: { ethConfig: { from: ethFrom } } } = this.props;
    const proxies = auth && auth.user && auth.user.proxies || [];
    const availableFunds = analytics && analytics.data && analytics.data.availableFunds || 0;
    if (loans!.loansState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />;
    }

    let filteredLoans: Array<Loan> = [];
    const hasAdminPermissions = auth.user && auth.user.permissions.canSetInterestRate;
    if (loans && loans.loans && loans.loansState === 'found' && auth.user) {
      filteredLoans = hasAdminPermissions  ? loans.loans : loans.loans.filter(l => auth.user && auth.user.proxies.includes(l.ownerOf));
    }

    return <Box >
      <Box direction="row" align="center">
      <Box basis={'full'} gap="medium" alignSelf="center" margin={{ bottom: 'medium' }}>
        <DashboardMetric label="Total funds available for borrowing">
            <NumberDisplay value={baseToDisplay(availableFunds, 18)} suffix=" DAI" precision={18} />
        </DashboardMetric>
      </Box>
      </Box>
      <LoanListData loans={filteredLoans} proxies={proxies} userAddress={ethFrom}> </LoanListData>
    </Box>;
  }
}

export default connect(state => state, { loadLoans, loadAnalyticsData, loadUserProxies })(LoanList);
