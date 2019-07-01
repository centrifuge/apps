import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, TextInput, Button } from 'grommet';
import LoanNftData from '../LoanNftData.tsx';
import Link from 'next/link';

interface Props {
  loanId: string;
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: number) => Promise<void>;
}

class LoanDetail extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, parseInt(this.props.loanId, 10));
  }

  render() {
    const { loans, loanId, tinlake } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return 'Loading...'; }
    if (singleLoanState === 'not found') {
      return <Alert type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, principal, price, debt, owner } = singleLoan!;

    return <Box>
      {status === 'Whitelisted' && owner === tinlake.ethConfig.from &&
        <Link href={`/borrower/borrow?loanId=${loanId}`}><Button primary>Borrow</Button></Link>}
      {status === 'Ongoing' && owner === tinlake.ethConfig.from &&
        <Link href={`/borrower/repay?loanId=${loanId}`}><Button primary>Repay</Button></Link>}

      <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="Loan ID">
          <TextInput value={loanId} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Loan Status">
          <TextInput value={status} disabled /></FormField></Box>
      </Box>

      <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
        <Box basis={'1/4'} gap="medium"><FormField label="Appraisal Amount">
          <TextInput value={'TBD'} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Principal Amount">
          <TextInput value={principal.toString()} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Debt">
          <TextInput value={debt.toString()} disabled /></FormField></Box>
        <Box basis={'1/4'} gap="medium"><FormField label="Interest Rate">
          <TextInput value={price.toString()} disabled /></FormField></Box>
      </Box>

      <LoanNftData loan={singleLoan!} />
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanDetail);
