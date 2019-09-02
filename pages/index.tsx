import { Box, Anchor, Grommet } from 'grommet';
import Header from '../components/Header';
import Link from 'next/link';
import Dashboard from '../containers/Dashboard';
import WithTinlake from '../components/WithTinlake';
import WithAppollo from '../components/WithAppollo';
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
      <WithTinlake render={tinlake =>
        <WithAppollo render={appolloClient => <Dashboard tinlake={tinlake} appolloClient={appolloClient} />} />
      }/>
    </Box>
  </Box>
</Box>;
}

export default Home;
