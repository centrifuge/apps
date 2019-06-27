import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake, { Loan, BalanceDebt } from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';
// tslint:disable-next-line:import-name
import BN from 'bn.js';

interface InternalLoan extends Loan {
  id: number;
  balance: BN;
  debt: BN;
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
        id: i,
        principal: loan.principal,
        price: loan.price,
        registry: loan.registry,
        tokenId: loan.tokenId,
        balance: balanceDebtData[i].balance,
        debt: balanceDebtData[i].debt,
      });
    });

    this.setState({ loans: extendedLoansData });
  }

  render() {
    return <div>
      Found {this.state.count} loans

      <table>
        <thead>
          <tr>
            <th>NFT ID</th>
            <th>NFT Owner</th>
            <th>NFT Status</th>
            <th>Principal</th>
            <th>Interest rate</th>
            <th>Debt</th>
            <th>Maturity Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {this.state.loans.map(loan =>
          <tr key={loan.tokenId.toString()}>
            <td>{loan.tokenId.toString()}</td>
            <td>{loan.registry}</td>
            <td>{getLoanStatus(loan.balance, loan.debt)}</td>
            <td>{loan.principal.toString()}</td>
            <td>{loan.price.toString()}</td>
            <td>{loan.debt.toString()}</td>
            <td>-</td>
            <td><Link href={`/admin/loan?loanId=${loan.id}`}>
              <a>View</a></Link></td>
          </tr>,
          )}
          </tbody>
      </table>
    </div>;
  }
}

export default LoanList;

type LoanStatus = 'Submitted' | 'Whitelisted' | 'Collateralized' | 'Repaid' | 'Rejected';

function getLoanStatus(balance: BN, debt: BN): LoanStatus {
  if (!balance.isZero()) { return 'Whitelisted'; }
  if (balance.isZero() && !debt.isZero()) { return 'Collateralized'; }
  if (balance.isZero() && debt.isZero()) { return 'Repaid'; }
  return 'Submitted';
}
