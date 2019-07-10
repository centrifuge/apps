import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';
import MintNFT from '../../components/MintNFT';
import Header, { MenuItem } from '../../components/Header';

const menuItems: MenuItem[] = [
  { label: 'NFTs', route: '/admin' },
];

class MintNFTPage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/temp/mint-nft'}
        menuItems={menuItems.reverse()}
        section="BORROWER"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake => <MintNFT tinlake={tinlake} />} />
        </Box>
      </Box>
    </Box>;
  }
}

export default MintNFTPage;
