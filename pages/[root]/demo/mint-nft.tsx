import * as React from 'react';
import WithTinlake from '../../../components/WithTinlake';
import { Box } from 'grommet';
import MintNFT from '../../../components/MintNFT';
import Header from '../../../components/Header';
import { menuItems } from '../../../menuItems';
import ContainerWithFooter from '../../../components/ContainerWithFooter';
import config, { Pool } from '../../../config';
import { WithRouterProps } from 'next/dist/client/with-router';
import { GetStaticProps } from 'next';
import Auth from '../../../components/Auth';

interface Props extends WithRouterProps {
  root: string;
  pool: Pool;
}

class MintNFTPage extends React.Component<Props> {
  render() {
    const { pool } = this.props;

    return <ContainerWithFooter>
      <Header
        poolTitle={pool.name}
        selectedRoute={'/demo/mint-nft'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake addresses={pool.addresses} contractConfig={pool.contractConfig} render={tinlake =>
            <Auth tinlake={tinlake} render={() =>
              <MintNFT tinlake={tinlake} />
            } />
          } />
        </Box>
      </Box>
    </ContainerWithFooter>;
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

export default MintNFTPage;
