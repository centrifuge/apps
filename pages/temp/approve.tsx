import * as React from 'react';
import WithTinlake from '../../components/WithTinlake';
import { Box } from 'grommet';
import Approve from '../../components/Approve';
import Header from '../../components/Header';
import { menuItems } from '../../menuItems';

class ApprovePage extends React.Component {
  render() {
    return <Box align="center">
      <Header
        selectedRoute={'/temp/backer-approve'}
        menuItems={menuItems}
      />
        <Box
          justify="center"
          direction="row"
        >
        <Box width="xlarge" >
          <WithTinlake render={tinlake => <Approve tinlake={tinlake} />} />
        </Box>
      </Box>
    </Box>;
  }
}

export default ApprovePage;
