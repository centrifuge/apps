import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake, { Loan, BalanceDebt } from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';
// tslint:disable-next-line:import-name
import BN from 'bn.js';
import { Box, DataTable } from 'grommet';

interface InternalLoan extends Loan {
  id: number;
  balance: BN;
  debt: BN;
  status: string;
}

interface Props {
  tinlake: Tinlake;
}

interface State {
  count: number;
  loans: InternalLoan[];
}

class LoanList extends React.Component<Props, State> {
  state: State = {
    count: 0,
    loans: [],
  };

  componentDidMount() {
    this.init();
  }

  init = async () => {
    const count = await this.props.tinlake.loanCount();

    this.setState({ count: count.toNumber() });

    const loanPromises: Promise<Loan>[] = [];
    const balanceDebtPromises: Promise<BalanceDebt>[] = [];

    for (let i = 0; i < count.toNumber(); i += 1) {
      loanPromises.push(this.props.tinlake.getLoan(i));
      balanceDebtPromises.push(this.props.tinlake.getBalanceDebt(i));
    }

    const loans = await Promise.all(loanPromises);
    const balanceDebtData = await Promise.all(balanceDebtPromises);

    const extendedLoansData = loans.map((loan, i) => {
      return ({
        loanId: i,
        principal: loan.principal,
        price: loan.price,
        registry: loan.registry,
        tokenId: loan.tokenId,
        balance: balanceDebtData[i].balance,
        debt: balanceDebtData[i].debt,
        status: getLoanStatus(loan.principal, balanceDebtData[i].debt),
      });
    });

    this.setState({ loans: extendedLoansData });
  }

  render() {
    return <Box>
      Found {this.state.count} loans

      <DataTable data={this.state.loans} columns={[
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
          <Link href={`/admin/loan?loanId=${l.id}`}><a>View</a></Link> },
      ]} />
    </Box>;
  }
}

export default LoanList;

type LoanStatus = 'Whitelisted' | 'Ongoing' | 'Repaid';

function getLoanStatus(principal: BN, debt: BN): LoanStatus {
  if (!principal.isZero()) { return 'Whitelisted'; }
  if (principal.isZero() && !debt.isZero()) { return 'Ongoing'; }
  if (principal.isZero() && debt.isZero()) { return 'Repaid'; }
  throw Error('Unknown loan status');
}
