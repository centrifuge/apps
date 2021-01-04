import { Box } from 'grommet'
import { GetStaticProps } from 'next'
import * as React from 'react'
import Auth from '../components/Auth'
import Container from '../components/Container'
import Header from '../components/Header'
import WithFooter from '../components/WithFooter'
import WithTinlake from '../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS } from '../config'
import AddRewardAddress from '../containers/AddRewardAddress'
import Rewards from '../containers/Rewards'
import UserRewards from '../containers/UserRewards'

interface Props {
  ipfsPools: IpfsPools
}

const RewardsPage: React.FC<Props> = (props: Props) => {
  return (
    <WithFooter>
      <Header selectedRoute={''} menuItems={[]} ipfsPools={props.ipfsPools} />
      <Container style={{ backgroundColor: '#f9f9f9' }}>
        <Box justify="center" direction="row">
          <Box width="xlarge">
            <WithTinlake
              addresses={{
                CLAIM_RAD: '0x297237e17F327f8e5C8dEd78b15761A7D513353b', // TODO move to config
              }}
              render={(tinlake) => (
                <Auth
                  tinlake={tinlake}
                  render={() => (
                    <>
                      <Rewards ipfsPools={props.ipfsPools} />
                      <UserRewards ipfsPools={props.ipfsPools} />
                      <AddRewardAddress tinlake={tinlake} />
                    </>
                  )}
                />
              )}
            />
          </Box>
        </Box>
      </Container>
    </WithFooter>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()
  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { ipfsPools }
  return { props: newProps }
}

export default RewardsPage
