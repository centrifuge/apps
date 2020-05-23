import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';
import ContainerWithFooter from '../components/ContainerWithFooter';
import WithTinlake from '../components/WithTinlake';
import Auth from '../components/Auth';

function Home() {
  return (
    <ContainerWithFooter>
      <Header selectedRoute={''} menuItems={[]} />
      <Box justify="center" direction="row" >
        <Box width="xlarge">
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake} render={() =>
              <Dashboard />
            } />
          } />
        </Box>
      </Box>
    </ContainerWithFooter>
  );
}

export default Home;
