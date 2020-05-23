import { Box } from 'grommet';
import * as React from 'react';
import Header from '../../components/Header';
import Overview from '../../containers/Overview';
import WithTinlake from '../../components/WithTinlake';
import { menuItems } from '../../menuItems';
import config, { Pool as IPool } from '../../config';
import { GetStaticProps } from 'next';
import ContainerWithFooter from '../../components/ContainerWithFooter';
import Auth from '../../components/Auth';

interface Props {
  root: string;
  pool: IPool;
}

class Pool extends React.Component <Props> {

  render() {
    const { pool } = this.props;

    return (
      <ContainerWithFooter>
        <Header poolTitle={pool.name} selectedRoute={'/'} menuItems={menuItems} />
        <Box justify="center" direction="row" >
          <Box width="xlarge">
            <WithTinlake addresses={pool.addresses} contractConfig={pool.contractConfig} render={tinlake =>
              <Auth tinlake={tinlake} render={() =>
                <Overview tinlake={tinlake} selectedPool={pool} />
              } />
            } />
          </Box>
        </Box>
      </ContainerWithFooter>
    );
  }
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = config.pools.map(pool => ({ params: { root: pool.addresses.ROOT_CONTRACT } }));

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { root: params?.root, pool: config.pools.find(p => p.addresses.ROOT_CONTRACT === params?.root) } };
};

export default Pool;
