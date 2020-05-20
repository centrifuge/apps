import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';
import ContainerWithFooter from '../components/ContainerWithFooter';

function Home() {
  return (
    <ContainerWithFooter>
      <Header selectedRoute={'/'} menuItems={[]} />
      <Box justify="center" direction="row" >
        <Box width="xlarge">
          <Dashboard />
        </Box>
      </Box>
    </ContainerWithFooter>
  );
}

export default Home;
