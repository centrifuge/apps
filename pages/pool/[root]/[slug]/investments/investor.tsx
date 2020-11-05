import * as React from 'react'
import InvestorView from '../../../../../containers/Investment/Investor'
import WithTinlake from '../../../../../components/WithTinlake'
import { Box, Heading, Text } from 'grommet'
import Header from '../../../../../components/Header'
import { menuItems } from '../../../../../menuItems'
import SecondaryHeader from '../../../../../components/SecondaryHeader'
import { BackLink } from '../../../../../components/BackLink'
import Auth from '../../../../../components/Auth'
import withRouter, { WithRouterProps } from 'next/dist/client/with-router'
import WithFooter from '../../../../../components/WithFooter'
import config, { Pool } from '../../../../../config'
import { GetStaticProps } from 'next'
import Container from '../../../../../components/Container'
import Head from 'next/head'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
}

class InvestorPage extends React.Component<Props> {
  render() {
    const { pool } = this.props
    const { investorAddress }: { investorAddress: string } = this.props.router.query as any

    return (
      <WithFooter>
        <Head>
          <title>
            Investor {investorAddress}: {pool.metadata.name} | Tinlake | Centrifuge | Decentralized Asset Financing
          </title>
        </Head>
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/investments/investor'}
          menuItems={menuItems}
        />
        <Container>
          <Box justify="center" direction="row" style={{ flex: 1 }}>
            <Box width="xlarge">
              <WithTinlake
                version={pool.version}
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={(auth) => (
                      <Box>
                        <SecondaryHeader>
                          <Box direction="row" gap="small" align="center">
                            <BackLink href={'/investments'} />
                            <Box direction="row" gap="small" align="center">
                              <Heading level="3">Investor Details </Heading>
                            </Box>
                            <Box align="end">
                              <Text style={{ color: '#808080' }}> address: {investorAddress}</Text>
                            </Box>
                          </Box>
                        </SecondaryHeader>
                        <InvestorView investorAddress={investorAddress} tinlake={tinlake} auth={auth} />
                      </Box>
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
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = config.pools.map((pool) => ({
    params: { root: pool.addresses.ROOT_CONTRACT, slug: pool.metadata.slug },
  }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { root: params?.root, pool: config.pools.find((p) => p.addresses.ROOT_CONTRACT === params?.root) } }
}

export default withRouter(InvestorPage)
