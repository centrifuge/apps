import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';

interface Props {
  tinlake: Tinlake;
}

interface State {
}

class WhitelistNFT extends React.Component<Props, State> {
  state: State = {
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
      <button onClick={this.mint}>Mint NFT</button>
    </div>;
  }
}

export default WhitelistNFT;
