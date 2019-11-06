import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import WhitelistNFT from '../../containers/WhitelistNFT';
import { Box } from 'grommet';
import Header from '../../components/Header';
import Alert from '../../components/Alert';
import Auth from '../../components/Auth';
import { menuItems } from '../../menuItems';

class WhitelistNFTPage extends React.Component<{ tokenId: string }> {

  static async getInitialProps({ query }: any) {
    return { tokenId: query.tokenId };
  }

  render() {
    const { tokenId } = this.props;
    return <Box align="center">
      <Header
        selectedRoute={'/admin/whitelist-nft'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization
              render={auth => auth.isAdmin ?
                <WhitelistNFT tinlake={tinlake} tokenId={tokenId} />
                :
                <Alert margin="medium" type="error">
                  Please use an admin account to access this page</Alert>
              } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default WhitelistNFTPage;
