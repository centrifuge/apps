import * as React from 'react';
import { Box } from 'grommet';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { LoansState, loadLoans } from '../../../ducks/loans';
import { AnalyticsState, loadAnalyticsData } from '../../../ducks/analytics';
import { baseToDisplay } from 'tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import { AuthState } from '../../../ducks/auth';
import LoanListData from '../../../components/Loan/List';
import NumberDisplay from '../../../components/NumberDisplay';
import DashboardMetric from '../../../components/DashboardMetric';
import { Loan } from '../../../services/tinlake/actions';

interface Props {
  tinlake: any;
  loans?: LoansState;
  loadLoans?: (tinlake: any) => Promise<void>;
  loadAnalyticsData?: (tinlake: any) => Promise<void>;
  auth: AuthState;
  analytics: AnalyticsState
}

class LoanList extends React.Component<Props> {
  componentWillMount() {
    const { loadLoans, loadAnalyticsData } = this.props
    loadLoans && loadLoans(this.props.tinlake);
    loadAnalyticsData && loadAnalyticsData(this.props.tinlake);
  }

  render() {
    const { loans, analytics, auth, tinlake: { ethConfig: { from: ethFrom } } } = this.props;
    const availableFunds = analytics && analytics.data && analytics.data.availableFunds || 0;
    if (loans!.loansState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />;
    }

    let filteredLoans: Array<Loan> = [];
    const hasAdminPermissions = auth.user && ( auth.user.permissions.canSetInterestRate || auth.user.permissions.canSetCeiling);
    if (loans && loans.loans && loans.loansState === 'found' && auth.user) {
      filteredLoans = hasAdminPermissions  ? loans.loans : loans.loans.filter(l => l.ownerOf === auth.user.address);
    }

    return <Box>
      <InfoDataContainer basis={'1/2'} gap="medium" margin={{ bottom: "medium" }}>
        <DashboardMetric label="Total funds available for borrowing">
            <NumberDisplay value={baseToDisplay(availableFunds, 18)} suffix=" DAI" precision={18} />
        </DashboardMetric>
      </InfoDataContainer>
      <LoanListData loans={filteredLoans} userAddress={ethFrom}> </LoanListData>
    </Box>
  }
}

const InfoDataContainer = styled(Box)`
  padding: 20px;
  border-radius: 3px;
  background: #f7f7f7;
`;

export default connect(state => state, { loadLoans, loadAnalyticsData})(LoanList);
