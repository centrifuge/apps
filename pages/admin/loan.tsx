import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
// tslint:disable-next-line:import-name

declare var web3: any;

class Loan extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }) {
    console.log('loanId', query.loanId);
    return { loanId: query.loanId };
  }

  tinlake: Tinlake | undefined;

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

  }

  render() {
    return <div>
      <h1>View NFT</h1>
      Loan ID {this.props.loanId}
    </div>;
  }
}

export default Loan;
