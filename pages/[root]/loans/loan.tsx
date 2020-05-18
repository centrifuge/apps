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

interface Props extends WithRouterProps {
}

class LoanPage extends React.Component<Props> {

  render() {
    const { loanId }: { loanId: string } = this.props.router.query as any;

    return <Box align="center" pad={{ horizontal: 'small' }}>
      <Header
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
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake}
              render={auth => <Box>{loanId && <LoanView auth={auth} tinlake={tinlake} loanId={loanId} />}</Box>} />
          } />
        </Box>
      </Box>
    </Box>;
  }
}

export default withRouter(LoanPage);
