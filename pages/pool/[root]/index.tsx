import { Box } from 'grommet'
import { GetStaticPaths, GetStaticProps } from 'next'
import * as React from 'react'
import Header from '../../../components/Header'
import WithTinlake from '../../../components/WithTinlake'
import { menuItems, noDemo } from '../../../menuItems'
import config, { ArchivedPool, UpcomingPool, Pool as LivePool } from '../../../config'
import WithFooter from '../../../components/WithFooter'
import Auth from '../../../components/Auth'
import Container from '../../../components/Container'
import Head from 'next/head'
import OverviewUpcoming from '../../../containers/OverviewUpcoming'
import OverviewArchived from '../../../containers/OverviewArchived'

interface Props {
  root: string
  pool: ArchivedPool | UpcomingPool | LivePool
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
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/'}
          menuItems={'isArchived' in pool || 'isUpcoming' in pool ? [] : menuItems.filter(noDemo)}
        />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge">
              <WithTinlake
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={() =>
                      'isArchived' in pool ? (
                        <OverviewArchived selectedPool={pool} />
                      ) : (
                        <OverviewUpcoming tinlake={tinlake} selectedPool={pool as UpcomingPool} />
                      )
                    }
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

export const getStaticPaths: GetStaticPaths = async () => {
  // We'll pre-render only these paths at build time.
  let paths = config.upcomingPools.map((pool) => ({ params: { root: pool.metadata.slug } }))
  const archivePaths = config.archivedPools.map((pool) => ({ params: { root: pool.metadata.slug } }))
  paths = paths.concat(archivePaths)

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    throw new Error(`Params are not passed`)
  }

  let pool: UpcomingPool | ArchivedPool | undefined
  pool = config.upcomingPools.find((p) => p.metadata.slug === params!.root)
  if (!pool) {
    pool = config.archivedPools.find((p) => p.metadata.slug === params!.root)
  }
  if (!pool) {
    throw new Error(`Pool ${params.root} cannot be loaded`)
  }

  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { pool, root: params.root as string, key: pool.metadata.name || '-' }

  return { props: newProps }
}

export default Pool
