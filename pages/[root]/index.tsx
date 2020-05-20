import { Box } from 'grommet';
import * as React from 'react';
import Header from '../../components/Header';
import Overview from '../../containers/Overview';
import WithTinlake from '../../components/WithTinlake';
import { menuItems } from '../../menuItems';
import config from '../../config';
import { GetStaticProps } from 'next';
import ContainerWithFooter from '../../components/ContainerWithFooter';

const pools = config.pools;

interface Props {
  root: string;
}

class Pool extends React.Component <Props> {

  render() {
    const { root } = this.props;
    const selectedPool = pools.find(pool => pool.addresses.ROOT_CONTRACT === root);
    return (
      <ContainerWithFooter>
        <Header selectedRoute={'/'} menuItems={menuItems} />
        { selectedPool &&
          <Box justify="center" direction="row" >
            <Box width="xlarge">
              <WithTinlake render={tinlake => <Overview tinlake={tinlake} selectedPool={selectedPool}  />} />
            </Box>
          </Box>
        }
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
  return { props: { root: params?.root } };
};

export default Pool;
