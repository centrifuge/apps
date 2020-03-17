import * as React from 'react';
import { Box, Button, Heading, Text } from 'grommet';
import Alert from '../Alert';
import SecondaryHeader from '../SecondaryHeader';
import { BackLink } from '../BackLink';
import { authTinlake } from '../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import BN from 'bn.js';

interface Props {
  tinlake: any;
}

interface State {
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

const SUCCESS_STATUS = '0x1';

class Approve extends React.Component<Props, State> {
  state: State = {
    is: null,
    errorMsg: ''
  };

  approve = async () => {
    const { tinlake } = this.props;
    const addresses = tinlake.contractAddresses;

    this.setState({ is: 'loading' });

    try {
      await authTinlake();

      const amount = (new BN(-1)).toString();
      const approveCurrencyResult = await tinlake.approveCurrency(addresses['LENDER'], amount);

      if (approveCurrencyResult.status !== SUCCESS_STATUS || approveCurrencyResult.events[0].event.name !== 'Approval') {
        this.setState({ is: 'error', errorMsg: JSON.stringify(approveCurrencyResult) });
        return;
      }

      const approveCollateralResult = await tinlake.approveCollateral(addresses['LENDER'], amount);

      if (approveCollateralResult.status !== SUCCESS_STATUS || approveCollateralResult.events[0].event.name !== 'Approval') {
        this.setState({ is: 'error', errorMsg: JSON.stringify(approveCollateralResult) });
        return;
      }

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { is, errorMsg } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <BackLink href="/loans" />
          <Heading level="3">Approve</Heading>
        </Box>

        <Button primary onClick={this.approve} label="Approve"
          disabled={is === 'loading' || is === 'success'} />
      </SecondaryHeader>

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Please open MetaMask and approve both transactions. The approval might take a few seconds...'} />
        :
        <Box pad={{ horizontal: 'medium' }}>
          {is === 'success' && <Alert type="success">
            Successfully approved<br />
          </Alert>}
          {is === 'error' && <Alert type="error">
            <Text weight="bold">
              Error approving </Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}

        </Box>

      }
      <Alert type="info" margin={{ vertical: 'medium' }}>
        This is a temporary page for backers to enable lenders to take currency and collateral.
        Backers need to sign two transactions:
        <br />
        First transaction: Backer allows lender to take currency
        <br />
        Second transaction: Backer allows lender to take collateral
      </Alert>
    </Box>;
  }
}

export default Approve;
