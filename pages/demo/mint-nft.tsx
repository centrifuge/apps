import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';
import MintNFT from '../../components/MintNFT';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';

class MintNFTPage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/demo/mint-nft'}
        menuItems={menuItems}
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
