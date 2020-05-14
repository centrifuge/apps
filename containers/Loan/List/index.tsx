import * as React from 'react';
import { Box } from 'grommet';
import { connect } from 'react-redux';
import { LoansState, loadLoans } from '../../../ducks/loans';
import { PoolState, loadPool } from '../../../ducks/pool';
import { baseToDisplay } from 'tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import { AuthState, loadUserProxies } from '../../../ducks/auth';
import LoanListData from '../../../components/Loan/List';
import NumberDisplay from '../../../components/NumberDisplay';
import DashboardMetric from '../../../components/DashboardMetric';

interface Props {
  tinlake: any;
  loans?: LoansState;
  loadLoans?: (tinlake: any) => Promise<void>;
  loadPool?: (tinlake: any) => Promise<void>;
  auth?: AuthState;
  pool?: PoolState;
}

class LoanList extends React.Component<Props> {
  componentDidMount() {
    const { loadLoans, loadPool, tinlake } = this.props;
    loadLoans && loadLoans(tinlake);
    loadPool && loadPool(tinlake);
  }

  render() {
    const { loans, pool, tinlake: { ethConfig: { from: ethFrom } } } = this.props;
    const availableFunds = pool && pool.data && pool.data.availableFunds || '0';
    if (loans!.loansState === 'loading') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />;
    }

    return <Box margin={{ bottom: 'large' }}>
      <Box direction="row" align="center">
      <Box basis={'full'} gap="medium" alignSelf="center" margin={{ bottom: 'medium' }}>
        <DashboardMetric label="Total funds available for borrowing">
            <NumberDisplay value={baseToDisplay(availableFunds, 18)} suffix=" DAI" precision={18} />
        </DashboardMetric>
      </Box>
      </Box>
      <LoanListData loans={loans && loans.loans || []}  userAddress={ethFrom}> </LoanListData>
    </Box>;
  }
}

export default connect(state => state, { loadLoans, loadPool, loadUserProxies })(LoanList);
