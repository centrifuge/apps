import { Box } from 'grommet'
import { GetStaticPaths, GetStaticProps } from 'next'
import * as React from 'react'
import Header from '../../../../components/Header'
import Overview from '../../../../containers/Overview'
import WithTinlake from '../../../../components/WithTinlake'
import { menuItems } from '../../../../menuItems'
import config, { Pool as IPool } from '../../../../config'
import WithFooter from '../../../../components/WithFooter'
import Auth from '../../../../components/Auth'
import Container from '../../../../components/Container'
import Head from 'next/head'

interface Props {
  root: string
  pool: IPool
  key: string
}

class Pool extends React.Component<Props> {
  render() {
    const { pool } = this.props

    return (
      <WithFooter>
        <Head>
          <title>Pool Overview: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header poolTitle={pool.metadata.shortName || pool.metadata.name} selectedRoute={'/'} menuItems={menuItems} />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge">
              <WithTinlake
                version={pool.version}
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth tinlake={tinlake} render={() => <Overview tinlake={tinlake} selectedPool={pool} />} />
                )}
              />
            </Box>
          </Box>
        </Container>
      </WithFooter>
    )
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  // We'll pre-render only these paths at build time.
  const paths = config.pools.map((pool) => ({
    params: { root: pool.addresses.ROOT_CONTRACT, slug: pool.metadata.slug },
  }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    throw new Error(`Params are not passed`)
  }

  const pool = config.pools.find((p) => p.addresses.ROOT_CONTRACT === params!.root)

  if (!pool) {
    throw new Error(`Pool ${params.root} cannot be loaded`)
  }

  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { pool, root: params.root as string, key: pool.metadata.name || '-' }

  return { props: newProps }
}

export default Pool
