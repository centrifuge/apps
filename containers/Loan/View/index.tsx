import * as React from 'react';
import { LoansState, loadLoan } from '../../../ducks/loans';
import { Box, Heading } from 'grommet';
import { connect } from 'react-redux';
import Alert from '../../../components/Alert';
import LoanData from '../../../components/Loan/Data';
import LoanBorrow from '../Borrow';
import LoanRepay from '../Repay';
import { Spinner } from '@centrifuge/axis-spinner';
import NftData from '../../../components/NftData';
import { AuthState, loadProxies } from '../../../ducks/auth';
import { TransactionState, resetTransactionState } from '../../../ducks/transactions';

interface Props {
  tinlake: any;
  loanId?: string;
  loans?: LoansState;
  loadLoan?: (tinlake: any, loanId: string, refresh?: boolean) => Promise<void>;
  auth?: AuthState;
  transactions?: TransactionState;
  resetTransactionState?: () => void;
  loadProxies?: () => Promise<void>;
}

// on state change tokenId --> load nft data for loan collateral
class LoanView extends React.Component<Props> {

  componentDidMount() {
    const { tinlake, loanId, loadLoan, resetTransactionState, loadProxies } = this.props;
    loanId && loadLoan!(tinlake, loanId);
    resetTransactionState && resetTransactionState();
    loadProxies && loadProxies();
  }

  componentWillUnmount() {
    this.props.resetTransactionState && this.props.resetTransactionState();
  }

  render() {
    const { loans, loanId, tinlake, auth, transactions } = this.props;
    const { loan, loanState } = loans!;
    if (loanState === null || loanState === 'loading') { return null; }
    if (loanState === 'not found') {
      return <Alert margin="medium" type="error">
        Could not find loan {loanId}</Alert>;
    }

    const hasBorrowerPermissions = loan && auth?.proxies?.includes(loan.ownerOf.toString());
    if (transactions && transactions.transactionState && transactions.transactionState === 'processing') {
      return <Spinner height={'calc(100vh - 89px - 84px)'} message={transactions.loadingMessage ||
        'Processing Transaction. This may take a few seconds. Please wait...'} />;
    }

    return <Box>
      {transactions && transactions.successMessage &&
      <Box margin={{ bottom: 'large' }}>
          <Alert type="success">
            {transactions.successMessage} </Alert>
      </Box>}

      {transactions && transactions.errorMessage &&
      <Box margin={{ bottom: 'large' }}>
          <Alert type="error">
            {transactions.errorMessage}
          </Alert>
      </Box>}

      <LoanData loan={loan!} />
      {loan && loan.status !== 'closed' &&
        <Box>
          {hasBorrowerPermissions &&
            <Box margin={{ top: 'large', bottom: 'large' }} >
              <Box gap="medium" align="start" margin={{ bottom: 'medium' }} >
                <Heading level="5" margin="none">Borrow / Repay </Heading>
              </Box>
              <Box direction="row">
                <LoanBorrow loan={loan!} tinlake={tinlake} />
                <LoanRepay loan={loan!} tinlake={tinlake} />
              </Box>
            </Box>
          }
        </Box>
      }
      {loan && loan.nft && <NftData data={loan.nft} authedAddr={tinlake.ethConfig.from} />}
    </Box>;
  }
}

export default connect(state => state, { loadLoan, resetTransactionState, loadProxies })(LoanView);
