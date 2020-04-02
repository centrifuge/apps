import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';
import WithTinlake from '../components/WithTinlake';
import { menuItems } from '../menuItems';

function Home() {
  return <Box align="center" pad={{horizontal: "small"}}>
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
        <Dashboard tinlake={tinlake} />
      }/>
    </Box>
  </Box>
</Box>;
}

export default Home;
