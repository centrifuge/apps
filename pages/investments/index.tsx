import * as React from 'react';
import InvestmentView from '../../containers/Investment/View';
import WithTinlake from '../../components/WithTinlake';
import { Box, Heading } from 'grommet';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';
import SecondaryHeader from '../../components/SecondaryHeader';
import Auth from '../../components/Auth';
import Alert from '../../components/Alert';

class InvestmentPage extends React.Component {
  render() {
    return <Box align="center" pad={{horizontal: "small"}}>
      <Header
        selectedRoute={'/investments'}
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
                      <Heading level="3">Investments</Heading>
                    </SecondaryHeader>
                    <InvestmentView tinlake={tinlake} auth={auth} />
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
export default InvestmentPage;
