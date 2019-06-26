import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake, { Loan } from 'tinlake';
// tslint:disable-next-line:import-name
import Link from 'next/link';

declare var web3: any;

interface InternalLoan extends Loan {
  id: number;
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

    const count = await this.tinlake.amountOfLoans();

    this.setState({ count: count.toNumber() });

    const loanPromises: Promise<Loan>[] = [];

    for (let i = 0; i < count.toNumber(); i += 1) {
      loanPromises.push(this.tinlake.getLoan(i));
    }

    const loans = (await Promise.all(loanPromises)).map((loan, i) => {
      return ({
        id: i,
        principal: loan.principal,
        price: loan.price,
        registry: loan.registry,
        tokenId: loan.tokenId,
      });
    });

    this.setState({ loans });
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
            <td>TODO</td>
            <td>{loan.principal.toString()}</td>
            <td>{loan.price.toString()}</td>
            <td>TODO</td>
            <td>TODO</td>
            <td><Link href={`/admin/loan/${loan.id}`}><a>View</a></Link></td>
          </tr>,
          )}
          </tbody>
      </table>
    </div>;
  }
}

export default Admin;
