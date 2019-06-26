import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake, { Loan } from 'tinlake';

declare var web3: any;

interface State {
  count: number;
  loans: Loan[];
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

    const loans = (await Promise.all(loanPromises)).map((loan) => {
      return ({
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
            <th>Registry</th>
            <th>TokenID</th>
            <th>Price</th>
            <th>Principal</th>
          </tr>
        </thead>
        <tbody>
        {this.state.loans.map(loan =>
          <tr key={loan.tokenId.toString()}>
            <td>{loan.registry}</td>
            <td>{loan.tokenId.toString()}</td>
            <td>{loan.price.toString()}</td>
            <td>{loan.principal.toString()}</td>
          </tr>,
          )}
          </tbody>
      </table>
    </div>;
  }
}

export default Admin;
