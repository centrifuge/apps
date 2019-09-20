import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';
import WithTinlake from '../components/WithTinlake';
import WithApollo from '../components/WithApollo';
import { menuItems } from '../menuItems';

function Home() {
  return <Box align="center">
  <Header
    selectedRoute={'/'}
    menuItems={menuItems}
  />
  <Box
    justify="center"
    direction="row"
  >
    <Box width="xlarge" >
      <WithTinlake render={tinlake =>
        <WithApollo render={apolloClient => <Dashboard tinlake={tinlake} apolloClient={apolloClient} />} />
      }/>
    </Box>
  </Box>
</Box>;
}

export default Home;
