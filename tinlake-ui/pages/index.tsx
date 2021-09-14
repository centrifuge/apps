import { Box } from 'grommet'
import { GetStaticProps } from 'next'
import * as React from 'react'
import Auth from '../components/Auth'
import Container from '../components/Container'
import Header from '../components/Header'
import { IpfsPoolsProvider } from '../components/IpfsPoolsProvider'
import { TinlakeProvider } from '../components/TinlakeProvider'
import WithFooter from '../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS } from '../config'
import Dashboard from '../containers/Dashboard'

interface Props {
  ipfsPools: IpfsPools
}

const Home: React.FC<Props> = (props: Props) => {
  return (
    <IpfsPoolsProvider value={props.ipfsPools}>
      <TinlakeProvider>
        <WithFooter>
          <Header selectedRoute={''} menuItems={[]} ipfsPools={props.ipfsPools} />
          <Container style={{ backgroundColor: '#f9f9f9' }}>
            <Box justify="center" direction="row">
              <Box width="xlarge">
                <Auth>
                  <Dashboard ipfsPools={props.ipfsPools} />
                </Auth>
              </Box>
            </Box>
          </Container>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()
  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { ipfsPools }
  return { props: newProps }
}

export default Home
