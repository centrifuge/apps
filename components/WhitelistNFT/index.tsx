import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import MintNFT from '../MintNFT';

interface Props {
  tinlake: Tinlake;
}

interface State {
  tokenId: string;
  principal: string;
  interestRate: string;
}

class WhitelistNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: '',
    principal: '',
    interestRate: '',
  };

  mint = async () => {
    const principal = 100;
    const appraisal = 300;

    console.log(`appraisal: ${appraisal}`);
    console.log(`principal: ${principal}`);

    const tokenID = `0x${Math.floor(Math.random() * (10 ** 15))}`;

    console.log(`token id: ${tokenID}`);

    const ethFrom = '0x0a735602a357802f553113f5831fe2fbf2f0e2e0';

    const res = await this.props.tinlake.mintNFT(ethFrom, tokenID);

    console.log(res);
  }

  render() {
    return <div>
      <MintNFT tinlake={this.props.tinlake} />

      <hr />

      <div>
        NFT ID <input onChange={e => this.setState({ tokenId: e.currentTarget.value }) }
          value={this.state.tokenId} />
      </div>
      <div>
        Principal <input onChange={e => this.setState({ principal: e.currentTarget.value }) }
          value={this.state.principal} />
      </div>
      <div>
        Interest rate <input onChange={e => this.setState({ interestRate: e.currentTarget.value }) }
          value={this.state.interestRate} />
      </div>
    </div>;
  }
}

export default WhitelistNFT;
