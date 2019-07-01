import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../components/WhitelistNFT';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Box } from 'grommet';

class WhitelistNFTPage extends React.Component {
  render() {
    return <AxisTheme full={true}><Box pad="large">
      <h1><Link href="/admin"><a>{'<-'}</a></Link>Whitelist NFT</h1>

      <WithTinlake render={tinlake => <WhitelistNFT tinlake={tinlake} />} />
    </Box></AxisTheme>;
  }
}

export default WhitelistNFTPage;
