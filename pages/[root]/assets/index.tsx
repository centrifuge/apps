import * as React from 'react';
import LoanList from '../../../containers/Loan/List';
import WithTinlake from '../../../components/WithTinlake';
import { Box, Heading, Button } from 'grommet';
import Header from '../../../components/Header';
import { menuItems } from '../../../menuItems';
import SecondaryHeader from '../../../components/SecondaryHeader';
import Auth from '../../../components/Auth';
import { PoolLink } from '../../../components/PoolLink';
import WithFooter from '../../../components/WithFooter';
import { WithRouterProps } from 'next/dist/client/with-router';
import config, { Pool } from '../../../config';
import { GetStaticProps } from 'next';
import Container from '../../../components/Container';

interface Props extends WithRouterProps {
  root: string;
  pool: Pool;
}

class LoanListPage extends React.Component<Props> {
  render() {
    const { pool } = this.props;

    return <WithFooter>
      <Header
        poolTitle={pool.shortName || pool.name}
        selectedRoute={'/assets'}
        menuItems={menuItems}
      />
      <Container>
        <Box justify="evenly" direction="row">
          <Box width="xlarge" gap="medium" >
            <WithTinlake addresses={pool.addresses} contractConfig={pool.contractConfig} render={tinlake =>
                <Auth tinlake={tinlake} render={auth =>
                  <Box>
                    <SecondaryHeader>
                      <Heading level="3">Assets</Heading>
                      <PoolLink href={'/assets/issue'}>
                        <Button primary label="Finance Asset" />
                      </PoolLink>
                    </SecondaryHeader>
                    <LoanList tinlake={tinlake} auth={auth} />
                  </Box>
                } />
            } />
          </Box>
        </Box>
      </Container>
    </WithFooter>;
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

export default LoanListPage;
