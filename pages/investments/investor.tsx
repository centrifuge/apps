import * as React from 'react';
import InvestorView from '../../containers/Investment/Investor';
import WithTinlake from '../../components/WithTinlake';
import { Box, Heading, Text } from 'grommet';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';
import SecondaryHeader from '../../components/SecondaryHeader';
import { BackLink } from '../../components/BackLink';
import Auth from '../../components/Auth';
import Alert from '../../components/Alert';

interface Props {
  investorAddress: string;
}

class InvestorPage extends React.Component<Props> {
  static async getInitialProps({ query }: any) {
    return { investorAddress: query.investorAddress };
  }

  render() {
    const { investorAddress } = this.props;
    return <Box align="center" pad={{ horizontal: "small" }}>
      <Header
        selectedRoute={'/investments/investor'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake} waitForAuthentication waitForAuthorization
              render={auth => auth && auth.state === 'loaded' && auth.user ?
                <Box>
                  <SecondaryHeader>
                    <Box direction="row" gap="small" align="center">
                      <BackLink href={'/investments'} />
                      <Box direction="row" gap="small" align="center">
                        <Heading level="3">Investor Details </Heading>
                      </Box>
                      <Box align="end">
                          <Text style={{ color: '#808080' }}> address: {investorAddress}</Text>
                      </Box>

                    </Box>
                  </SecondaryHeader>
                  <InvestorView investorAddress={investorAddress} tinlake={tinlake} auth={auth} />
                </Box>
                :
                <Alert margin="medium" type="error">
                  Please authenticate to access this page </Alert>
              } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}
export default InvestorPage;
