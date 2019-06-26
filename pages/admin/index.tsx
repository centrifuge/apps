import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake, { Loan, BalanceDebt } from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';
// tslint:disable-next-line:import-name
import BN from 'bn.js';

declare var web3: any;

interface InternalLoan extends Loan {
  id: number;
  balance: BN;
  debt: BN;
}

interface State {
  count: number;
  loans: InternalLoan[];
}

class Admin extends React.Component {
  tinlake: Tinlake | undefined;

  state: State = {
    count: 0,
    loans: [],
  };

  componentDidMount() {
    this.init();
  }

  init = async () => {
    const accounts = await web3.currentProvider.enable();
    const account = accounts[0];
    console.log(`Using account ${account}`);

    this.tinlake = new Tinlake(web3.currentProvider, {
      ethConfig: { from: account },
    });

    const count = await this.tinlake.loanCount();

    this.setState({ count: count.toNumber() });

    const loanPromises: Promise<Loan>[] = [];
    const balanceDebtPromises: Promise<BalanceDebt>[] = [];

    for (let i = 0; i < count.toNumber(); i += 1) {
      loanPromises.push(this.tinlake.getLoan(i));
      balanceDebtPromises.push(this.tinlake.getBalanceDebt(i));
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
      <h1>NFTs</h1>

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
            <td><Link href={`/admin/loan?loanId=${loan.id}`} as={`/admin/loan/${loan.id}`}>
              <a>View</a></Link></td>
          </tr>,
          )}
          </tbody>
      </table>
    </div>;
  }
}

export default Admin;

type LoanStatus = 'Submitted' | 'Whitelisted' | 'Collateralized' | 'Repaid' | 'Rejected';

function getLoanStatus(balance: BN, debt: BN): LoanStatus {
  if (!balance.isZero()) { return 'Whitelisted'; }
  if (balance.isZero() && !debt.isZero()) { return 'Collateralized'; }
  if (balance.isZero() && debt.isZero()) { return 'Repaid'; }
  return 'Submitted';
}
