import * as React from 'react';
import WithTinlake from '../../../components/WithTinlake';
import LoanView from '../../../containers/Loan/View';
import { Box, Heading } from 'grommet';
import Header from '../../../components/Header';
import SecondaryHeader from '../../../components/SecondaryHeader';
import { menuItems } from '../../../menuItems';
import { BackLink } from '../../../components/BackLink';
import Auth from '../../../components/Auth';
import { withRouter } from 'next/router';
import { WithRouterProps } from 'next/dist/client/with-router';
import ContainerWithFooter from '../../../components/ContainerWithFooter';
import { GetStaticProps } from 'next';
import config, { Pool } from '../../../config';

interface Props extends WithRouterProps {
  root: string;
  pool: Pool;
}

class LoanPage extends React.Component<Props> {

  render() {
    const { pool } = this.props;
    const { loanId }: { loanId: string } = this.props.router.query as any;

    return <ContainerWithFooter>
      <Header
        poolTitle={pool.name}
        selectedRoute={'/loans/loan'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge">
          <SecondaryHeader>
            <Box direction="row" gap="small" align="center">
              <BackLink href={'/loans'} />
              <Heading level="3">Loan Details</Heading>
            </Box>
          </SecondaryHeader>
          <WithTinlake addresses={pool.addresses} contractConfig={pool.contractConfig} render={tinlake =>
            <Auth tinlake={tinlake} render={auth =>
              <Box>{loanId && <LoanView auth={auth} tinlake={tinlake} loanId={loanId} />}</Box>
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

export default withRouter(LoanPage);
