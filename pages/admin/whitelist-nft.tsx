import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
// import config from '../config';

declare var web3: any;

class WhitelistNFT extends React.Component {
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

  mint = async () => {
    if (!this.tinlake) { throw new Error('Tinlake not loaded!'); }

    const principal = 100;
    const appraisal = 300;

    console.log(`appraisal: ${appraisal}`);
    console.log(`principal: ${principal}`);

    const tokenID = `0x${Math.floor(Math.random() * (10 ** 15))}`;

    console.log(`token id: ${tokenID}`);

    const ethFrom = '0x0a735602a357802f553113f5831fe2fbf2f0e2e0';

    const res = await this.tinlake.mintNFT(ethFrom, tokenID);

    console.log(res);
  }

  render() {
    return <div>
      <h1>Whitelist NFT</h1>
      <button onClick={this.mint}>Mint NFT</button>

    </div>;
  }
}

export default WhitelistNFT;
