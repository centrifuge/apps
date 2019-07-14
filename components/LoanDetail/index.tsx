import * as React from 'react';
import Tinlake from 'tinlake';
import { LoansState, getLoan } from '../../ducks/loans';
import { connect } from 'react-redux';
import Alert from '../Alert';
import { Box, FormField, TextInput, Button, Heading } from 'grommet';
import LoanNftData from '../LoanNftData';
import Link from 'next/link';
import SecondaryHeader from '../SecondaryHeader';
import { LinkPrevious } from 'grommet-icons';
import LoanData from '../LoanData';

interface Props {
  loanId: string;
  mode: 'borrower' | 'admin';
  tinlake: Tinlake;
  loans?: LoansState;
  getLoan?: (tinlake: Tinlake, loanId: string) => Promise<void>;
}

class LoanDetail extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoan!(this.props.tinlake, this.props.loanId);
  }

  render() {
    const { loans, loanId, tinlake, mode } = this.props;
    const { singleLoan, singleLoanState } = loans!;

    if (singleLoanState === null || singleLoanState === 'loading') { return 'Loading...'; }
    if (singleLoanState === 'not found') {
      return <Alert type="error">
        Could not find loan {loanId}</Alert>;
    }

    const { status, loanOwner } = singleLoan!;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href={`/${mode}`}>
            <LinkPrevious />
          </Link>
          <Heading level="3">View Loan {loanId}</Heading>
        </Box>

        {status === 'Whitelisted' && loanOwner === tinlake.ethConfig.from &&
          <Link href={`/borrower/borrow?loanId=${loanId}`}><Button primary label="Borrow" /></Link>}
        {status === 'Ongoing' && loanOwner === tinlake.ethConfig.from &&
          <Link href={`/borrower/repay?loanId=${loanId}`}><Button primary label="Repay" /></Link>}
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/4'} gap="medium"><FormField label="Loan ID">
            <TextInput value={loanId} disabled /></FormField></Box>
          <Box basis={'1/4'} gap="medium"><FormField label="Loan Status">
            <TextInput value={status} disabled /></FormField></Box>
          <Box basis={'1/4'} gap="medium" />
          <Box basis={'1/4'} gap="medium" />
        </Box>

        <LoanData loan={singleLoan!} />

        <LoanNftData loan={singleLoan!} authedAddr={tinlake.ethConfig.from} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { getLoan })(LoanDetail);
