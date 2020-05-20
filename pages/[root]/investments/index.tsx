import * as React from 'react';
import InvestmentsView from '../../../containers/Investment/View';
import WithTinlake from '../../../components/WithTinlake';
import { Box, Heading } from 'grommet';
import Header from '../../../components/Header';
import { menuItems } from '../../../menuItems';
import SecondaryHeader from '../../../components/SecondaryHeader';
import Auth from '../../../components/Auth';

class InvestmentPage extends React.Component {
  render() {
    return <Box align="center" pad={{ horizontal: 'small' }}>
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
            <Auth tinlake={tinlake} render={auth =>
              <Box>
                <SecondaryHeader>
                  <Heading level="3">Investments</Heading>
                </SecondaryHeader>
                <InvestmentsView tinlake={tinlake} auth={auth} />
              </Box>
            } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}
export default InvestmentPage;
