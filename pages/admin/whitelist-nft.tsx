import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../components/WhitelistNFT';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';

class WhitelistNFTPage extends React.Component {
  render() {
    return <AxisTheme full={true}><div>
      <h1><Link href="/admin"><a>{'<-'}</a></Link>Whitelist NFT</h1>

      <WithTinlake render={tinlake => <WhitelistNFT tinlake={tinlake} />} />
    </div></AxisTheme>;
  }
}

export default WhitelistNFTPage;
