import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';

function Home() {
  return (
    <Box align="center" pad={{ horizontal: 'small' }}>
      <Header selectedRoute={'/'} menuItems={[]} />
      <Box justify="center" direction="row" >
        <Box width="xlarge">
          <Dashboard />
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
