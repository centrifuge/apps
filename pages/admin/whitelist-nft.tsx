import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../components/WhitelistNFT';
import { Box } from 'grommet';
import Header, { MenuItem } from '../../components/Header';
import AdminSwitch from '../../components/AdminSwitch';
import Alert from '../../components/Alert';

const menuItems: MenuItem[] = [
  { label: 'NFTs', route: '/admin' },
];

class WhitelistNFTPage extends React.Component<{ tokenId: string }> {
  static async getInitialProps({ query }: any) {
    return { tokenId: query.tokenId };
  }

  render() {
    const { tokenId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={'/admin/whitelist-nft'}
        menuItems={menuItems.reverse()}
        section="ADMIN"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <AdminSwitch tinlake={tinlake} render={isAdmin => isAdmin ?
              <WhitelistNFT tinlake={tinlake} tokenId={tokenId} />
              :
              <Alert type="error">Please use an admin account to access this page</Alert>
            } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default WhitelistNFTPage;
