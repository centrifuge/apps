import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';
import { Box, DataTable } from 'grommet';
import { connect } from 'react-redux';
import { InternalLoan, LoansState, getLoans } from '../../ducks/loans';
import { formatAddress } from '../../utils/formatAddress';

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
      <DataTable data={filteredLoans} columns={[
        { header: 'Loan ID', property: 'loanId', align: 'end' },
        { header: 'NFT ID', property: 'tokenId', align: 'end', render: (l: InternalLoan) =>
          <span title={l.tokenId.toString()}>{formatAddress(l.tokenId.toString())}</span> },
        { header: 'NFT Owner', property: 'nftOwner', align: 'end', render: (l: InternalLoan) =>
          <span title={l.nftOwner}>{formatAddress(l.nftOwner)}</span> },
        { header: 'NFT Status', property: 'status' },
        { header: 'Principal', property: 'principal', align: 'end',
          render: (l: InternalLoan) => l.principal.toString() },
        { header: 'Interest rate', property: 'price', align: 'end',
          render: (l: InternalLoan) => l.price.toString() },
        { header: 'Debt', property: 'debt', align: 'end',
          render: (l: InternalLoan) => l.debt.toString() },
        { header: 'Maturity Date', property: '', align: 'end', render: () => '-' },
        { header: 'Actions', property: 'id', align: 'end', render: (l: InternalLoan) =>
          <Link href={`/${mode}/loan?loanId=${l.loanId}`}><a>View</a></Link> },
      ]} />
    </Box>;
  }
}

export default connect(state => state, { getLoans })(LoanList);
