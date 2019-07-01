import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';
import { Box, DataTable } from 'grommet';
import { connect } from 'react-redux';
import { InternalLoan, LoansState, getLoans } from '../../ducks/loans';

interface Props {
  tinlake: Tinlake;
  loans?: LoansState;
  getLoans?: (tinlake: Tinlake) => Promise<void>;
}

class LoanList extends React.Component<Props> {
  componentWillMount() {
    this.props.getLoans!(this.props.tinlake);
  }

  render() {
    return <Box>
      <DataTable data={this.props.loans!.loans} columns={[
        { header: 'Loan ID', property: 'loanId', align: 'end' },
        { header: 'NFT ID', property: 'tokenId', align: 'end',
          render: (l: InternalLoan) => l.tokenId.toString() },
        { header: 'NFT Owner', property: 'registry', align: 'end' },
        { header: 'NFT Status', property: 'status' },
        { header: 'Principal', property: 'principal', align: 'end',
          render: (l: InternalLoan) => l.principal.toString() },
        { header: 'Interest rate', property: 'price', align: 'end',
          render: (l: InternalLoan) => l.price.toString() },
        { header: 'Debt', property: 'debt', align: 'end',
          render: (l: InternalLoan) => l.debt.toString() },
        { header: 'Maturity Date', property: '', align: 'end', render: () => '-' },
        { header: 'Actions', property: 'id', align: 'end', render: (l: InternalLoan) =>
          <Link href={`/admin/loan?loanId=${l.loanId}`}><a>View</a></Link> },
      ]} />
    </Box>;
  }
}

export default connect(state => state, { getLoans })(LoanList);
