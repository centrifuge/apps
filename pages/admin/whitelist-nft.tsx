import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../components/WhitelistNFT';
import Link from 'next/link';

class WhitelistNFTPage extends React.Component {
  render() {
    return <div>
      <h1><Link href="/admin"><a>{'<-'}</a></Link>Whitelist NFT</h1>

      <WithTinlake render={tinlake => <WhitelistNFT tinlake={tinlake} />} />
    </div>;
  }
}

export default WhitelistNFTPage;
