import * as React from 'react';
import WithTinlake from '../../../components/WithTinlake';
import IssueLoan from '../../../containers/Loan/Issue';
import { Box, Heading } from 'grommet';
import Header from '../../../components/Header';
import SecondaryHeader from '../../../components/SecondaryHeader';
import { menuItems } from '../../../menuItems';
import { BackLink } from '../../../components/BackLink';
import Auth from '../../../components/Auth';
import withRouter, { WithRouterProps } from 'next/dist/client/with-router';

interface Props extends WithRouterProps {
}

class LoanIssuePage extends React.Component<Props> {

  render() {
    const { tokenId, registry }: { tokenId: string, registry: string } = this.props.router.query as any;

    return <Box align="center" pad={{ horizontal: 'small' }}>
      <Header
        selectedRoute={'/loans/issue'}
        menuItems={menuItems}
      />
      <Box
        justify="center"
        direction="row"
      >
        <Box width="xlarge" >
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake}
              render={auth =>
                <Box>
                  <SecondaryHeader>
                    <Box direction="row" gap="small" align="center">
                      <BackLink href={'/loans'} />
                      <Heading level="3">Open Loan</Heading>
                    </Box>
                  </SecondaryHeader>
                  <IssueLoan tinlake={tinlake} auth={auth} tokenId={tokenId} registry={registry}/>
                </Box>
              } />
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default withRouter(LoanIssuePage);
