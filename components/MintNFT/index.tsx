import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';

interface Props {
  tinlake: Tinlake;
}

interface State {
  tokenId: string;
  is: 'minting' | 'success' | 'error' | null;
}

const SUCCESS_STATUS = '0x1';

class MintNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: `0x${Math.floor(Math.random() * (10 ** 15))}`,
    is: null,
  };

  mint = async () => {
    this.setState({ is: 'minting' });

    const ethFrom = '0x0a735602a357802f553113f5831fe2fbf2f0e2e0';
    // TODO

    const res = await this.props.tinlake.mintNFT(ethFrom, this.state.tokenId);
    if (res.status === SUCCESS_STATUS && res.events[0].event.name === 'Transfer') {
      this.setState({ is: 'success' });
    } else {
      console.log(res);
    }
  }

  render() {
    const { is, tokenId } = this.state;

    return <div>
      <h2>Mint an NFT</h2>

      <div>
        Token ID <input onChange={e => this.setState({ tokenId: e.currentTarget.value }) }
          value={tokenId} />
        <button onClick={this.mint}>Mint NFT</button>
      </div>

      <div>
        {is === 'minting' && 'Minting...'}
        {is === 'success' && `Successfully minted NFT for Token ID ${tokenId}`}
        {is === 'error' && `Error minted NFT for Token ID ${tokenId}, see console for details`}
      </div>
    </div>;
  }
}

export default MintNFT;
