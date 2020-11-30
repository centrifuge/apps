import { Box } from 'grommet'
import Auth from '../components/Auth'
import Container from '../components/Container'
import Header from '../components/Header'
import WithFooter from '../components/WithFooter'
import WithTinlake from '../components/WithTinlake'
import Dashboard from '../containers/Dashboard'

function Home() {
  return (
    <WithFooter>
      <Header selectedRoute={''} menuItems={[]} />
      <Container>
        <Box justify="center" direction="row">
          <Box width="xlarge">
            <WithTinlake render={(tinlake) => <Auth tinlake={tinlake} render={() => <Dashboard />} />} />
          </Box>
        </Box>
      </Container>
    </WithFooter>
  )
}

export default Home
