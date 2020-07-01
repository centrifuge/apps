import { Box } from 'grommet';
import Header from '../components/Header';
import Dashboard from '../containers/Dashboard';
import WithFooter from '../components/WithFooter';
import WithTinlake from '../components/WithTinlake';
import Auth from '../components/Auth';
import Container from '../components/Container';

function Home() {
  return (
    <WithFooter>
      <Header selectedRoute={''} menuItems={[]} />
      <Container>
        <Box justify="center" direction="row" >
          <Box width="xlarge">
            <WithTinlake render={tinlake =>
              <Auth tinlake={tinlake} render={() =>
                <Dashboard />
              } />
            } />
          </Box>
        </Box>
      </Container>
    </WithFooter>
  );
}

export default Home;
