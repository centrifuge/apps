import * as React from 'react';
import Tinlake from 'tinlake';
import Link from 'next/link';
import { Box, DataTable, Heading, Anchor } from 'grommet';
import { connect } from 'react-redux';
import { InternalLoan, LoansState, getLoans } from '../../ducks/loans';
import SecondaryHeader from '../SecondaryHeader';
import Address from '../Address';
import NumberDisplay from '../NumberDisplay';
import { baseToDisplay } from '../../utils/baseToDisplay';
import { feeToInterestRate } from '../../utils/feeToInterestRate';

interface Props {
  tinlake: Tinlake;
  loans?: LoansState;
  getLoans?: (tinlake: Tinlake) => Promise<void>;
  mode: 'borrower' | 'admin';
}

class LoanList extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoans!(this.props.tinlake);
  }

  render() {
    const { loans, mode, tinlake: { ethConfig: { from: ethFrom } } } = this.props;

    if (loans!.loansState === 'loading') {
      return 'Loading...';
    }

    const filteredLoans = mode === 'borrower' ? loans!.loans.filter(l => l.loanOwner === ethFrom) :
      loans!.loans;

    return <Box>
      <SecondaryHeader>
        <Heading level="3">Loans</Heading>
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        <DataTable data={filteredLoans} sortable columns={[
          { header: 'Loan ID', property: 'loanId', align: 'end' },
          {
            header: 'NFT ID', property: 'tokenId', align: 'end',
            render: (l: InternalLoan) => <Address address={l.tokenId.toString()} />,
          },
          {
            header: 'NFT Owner', property: 'nftOwner', align: 'end',
            render: (l: InternalLoan) => <>
              <Address address={l.nftOwner} /> {l.nftOwner === ethFrom && 'ME'}
            </>,
          },
          { header: 'NFT Status', property: 'status' },
          {
            header: 'Principal', property: 'principal', align: 'end',
            render: (l: InternalLoan) => l.status === 'Whitelisted' ?
              <NumberDisplay suffix=" DAI" precision={18} value={baseToDisplay(l.principal, 18)} />
              : '-',
          },
          {
            header: 'Interest rate', property: 'fee', align: 'end',
            render: (l: InternalLoan) => l.status === 'Repaid' ? '-' :
              <NumberDisplay suffix="%" value={feeToInterestRate(l.fee)} />,
          },
          {
            header: 'Debt', property: 'debt', align: 'end',
            render: (l: InternalLoan) => l.status === 'Whitelisted' ? '-' :
              <NumberDisplay suffix=" DAI" precision={18} value={baseToDisplay(l.debt, 18)} />,
          },
          {
            header: 'Actions', property: 'id', align: 'end', sortable: false,
            render: (l: InternalLoan) =>
              <Link href={`/${mode}/loan?loanId=${l.loanId}`}><Anchor>View</Anchor></Link>,
          },
        ]} />
      </Box>
    </Box>;
  }
}

export default connect(state => state, { getLoans })(LoanList);
