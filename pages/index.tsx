import { Box, Anchor } from 'grommet';
import Header from '../components/Header';
import Link from 'next/link';
import Dashboard from '../components/Dashboard';
import WithTinlake from '../components/WithTinlake';
import { menuItems } from '../menuItems';

function Home() {
  return <Box align="center">
  <Header
    selectedRoute={'/'}
    menuItems={menuItems}
    section=""
  />
  <Box
    justify="center"
    direction="row"
  >
    <Box width="xlarge" >
      <WithTinlake render={tinlake => <Dashboard tinlake={tinlake} />} />
    </Box>
  </Box>
</Box>;
}

export default Home;
