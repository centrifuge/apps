import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import config from '../../config';

declare var web3: any;

class Admin extends React.Component {
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
      <h1>NFTs</h1>

    </div>;
  }
}

export default Admin;
