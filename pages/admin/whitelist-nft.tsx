import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../components/WhitelistNFT';

class WhitelistNFTPage extends React.Component {
  render() {
    return <div>
      <h1>Whitelist NFT</h1>

      <WithTinlake render={tinlake => <WhitelistNFT tinlake={tinlake} />} />
    </div>;
  }
}

export default WhitelistNFTPage;
