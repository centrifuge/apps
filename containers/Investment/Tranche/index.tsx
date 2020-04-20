import * as React from 'react';
import { AuthState } from '../../../ducks/auth';
import { Box, Heading } from 'grommet';
import Alert from '../../../components/Alert';
import { Spinner } from '@centrifuge/axis-spinner';
import InvestorSupply from '../Supply';
import InvestorRedeem from '../Redeem';
import InvestorAllowance from '../Allowance';
import TrancheMetric from '../../../components/Investment/TrancheMetric';
import { TrancheType, Tranche } from '../../../services/tinlake/actions';
import { TransactionState } from '../../../ducks/transactions';

interface Props {
  tinlake: any;
  auth: AuthState;
  investor: Investor;
  transactions?: TransactionState;
  resetTransactionState?: () => void;
  tranche: Tranche;
}

class TrancheView extends React.Component<Props> {

  render() {
    const { auth, investor, transactions, tranche, tinlake } = this.props;
    const isAdmin = (tranche.type === "junior") && auth.user && auth.user.permissions.canSetInvestorAllowanceJunior
      || (tranche.type === "senior") && auth.user && auth.user.permissions.canSetInvestorAllowanceSenior;
    const isInvestor = (auth.user && investor) && (auth.user.address.toLowerCase() === investor.address.toLowerCase());
    if (transactions && transactions.transactionState && transactions.transactionState === 'processing') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={transactions.loadingMessage || 'Processing Transaction. This may take a fev seconds. Please wait...'} />;
    }

    return <Box>
      {transactions && transactions.successMessage &&
        <Box margin={{ top: 'medium' }}>
          <Alert type="success">
            {transactions.successMessage} </Alert>
        </Box>}

      {transactions && transactions.errorMessage &&
        <Box margin={{ top: 'medium' }}>
          <Alert type="error">
            {transactions.errorMessage}
          </Alert>
        </Box>}

      {investor && tranche &&
        <Box>
          <Box margin={{ top: "medium", bottom: "large" }} >
            <Box>
              <TrancheMetric tranche={tranche} investor={investor} type={tranche.type} />
            </Box>
          </Box>

          {isAdmin &&
            <Box margin={{ top: 'medium', bottom: 'large' }} >
              <Box>
                <InvestorAllowance trancheType={tranche.type} tinlake={tinlake} investor={investor} />
              </Box>
            </Box>
          }

          {isInvestor &&
            <Box margin={{ top: 'medium', bottom: 'large' }} >
              <Box gap="medium" align="start" margin={{ bottom: 'medium' }} >
                <Heading level="4" margin="none">Supply / Redeem </Heading>
              </Box>

              <Box direction="row">
                <InvestorSupply trancheType={tranche.type} investor={investor!} tinlake={tinlake}> </InvestorSupply>
                <InvestorRedeem tranche={tranche} investor={investor!} tinlake={tinlake}> </InvestorRedeem>
              </Box>
            </Box>
          }
        </Box>
      }

    </Box>;
  }
}

export default TrancheView;
