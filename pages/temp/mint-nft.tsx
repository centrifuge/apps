import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import Link from 'next/link';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Box } from 'grommet';
import MintNFT from '../../components/MintNFT';

class MintNFTPage extends React.Component {
  render() {
    return <AxisTheme full={true}><Box pad="large">
      <h1><Link href="/admin"><a>{'<-'}</a></Link>Mint NFT</h1>
      <p>This is a temporary page that will be removed once integrated with Centrifuge Gateway.</p>

      <WithTinlake render={tinlake => <MintNFT tinlake={tinlake} />} />
    </Box></AxisTheme>;
  }
}

export default MintNFTPage;
