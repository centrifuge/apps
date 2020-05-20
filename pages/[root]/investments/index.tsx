import * as React from 'react';
import InvestmentsView from '../../../containers/Investment/View';
import WithTinlake from '../../../components/WithTinlake';
import { Box, Heading } from 'grommet';
import Header from '../../../components/Header';
import { menuItems } from '../../../menuItems';
import SecondaryHeader from '../../../components/SecondaryHeader';
import Auth from '../../../components/Auth';
import ContainerWithFooter from '../../../components/ContainerWithFooter';

class InvestmentPage extends React.Component {
  render() {
    return <ContainerWithFooter>
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
    </ContainerWithFooter>;
  }
}
export default InvestmentPage;
