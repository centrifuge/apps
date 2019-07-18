import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import Alert from '../../components/Alert';
import { Box } from 'grommet';
import Header, { MenuItem } from '../../components/Header';
import UnwhitelistNFT from '../../components/UnwhitelistNFT';
import AdminSwitch from '../../components/AdminSwitch';

const menuItems: MenuItem[] = [
  { label: 'NFTs', route: '/admin' },
];

class UnwhitelistPage extends React.Component<{ loanId: string }> {
  static async getInitialProps({ query }: any) {
    return { loanId: query.loanId };
  }

  render() {
    const { loanId } = this.props;

    return <Box align="center">
      <Header
        selectedRoute={`/admin/unwhitelist-nft?loanId=${loanId}`}
        menuItems={menuItems.reverse()}
        section="ADMIN"
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge">
          {loanId ? (
            <WithTinlake render={tinlake =>
              <AdminSwitch tinlake={tinlake} render={isAdmin => isAdmin ?
                <UnwhitelistNFT tinlake={tinlake} loanId={loanId} />
                :
                <Alert margin="medium" type="error">
                  Please use an admin account to access this page</Alert>
              } />
            } />
          ) : (
              <Alert margin="medium" type="error">Please provide an ID</Alert>
            )}
        </Box>
      </Box>
    </Box>;
  }
}

export default UnwhitelistPage;
