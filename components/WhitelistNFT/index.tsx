import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import MintNFT from '../MintNFT';
import { Box, FormField, TextInput, Button } from 'grommet';
import Alert from '../Alert';

const SUCCESS_STATUS = '0x1';

interface Props {
  tinlake: Tinlake;
}

interface State {
  tokenId: string;
  principal: string;
  appraisal: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

class WhitelistNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: '',
    principal: '100',
    appraisal: '300',
    is: null,
    errorMsg: '',
  };

  whitelist = async () => {
    this.setState({ is: 'loading' });

    const { tinlake } = this.props;
    const { tokenId, principal, appraisal } = this.state;
    const ethFrom = tinlake.ethConfig.from;
    const addresses = tinlake.contractAddresses;

    try {
      // admit
      const res1 = await tinlake.adminAdmit(addresses['NFT_COLLATERAL'], tokenId, principal,
                                            ethFrom);

      console.log('admit result');
      console.log(res1.txHash);

      if (res1.status !== SUCCESS_STATUS || res1.events[0].event.name !== 'Transfer') {
        console.log(res1);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res1) });
        return;
      }

      // approve
      const loanId = res1.events[0].data[2].toString();
      console.log(`Loan id: ${loanId}`);
      const res2 = await tinlake.approveNFT(tokenId, addresses['SHELF']);

      console.log('approve results');
      console.log(res2.txHash);

      if (res2.status !== SUCCESS_STATUS || res2.events[0].event.name !== 'Approval') {
        console.log(res2);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
        return;
      }

      // appraise
      const res3 = await tinlake.adminAppraise(loanId, appraisal);

      console.log('appraisal results');
      console.log(res3.txHash);

      if (res3.status !== SUCCESS_STATUS) {
        console.log(res3);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res3) });
        return;
      }

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { tokenId, principal, appraisal, is, errorMsg } = this.state;

    return <Box>
      <MintNFT tinlake={this.props.tinlake} />

      <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'xlarge' }}>
        <Box basis={'1/4'} gap="medium">
          <FormField label="NFT ID">
            <TextInput
              value={tokenId}
              onChange={e => this.setState({ tokenId: e.currentTarget.value }) }
            />
          </FormField>
        </Box>
        <Box basis={'1/4'} gap="medium">
          <FormField label="Principal">
            <TextInput
              value={principal}
              onChange={e => this.setState({ principal: e.currentTarget.value }) }
            />
          </FormField>
        </Box>
        <Box basis={'1/4'} gap="medium">
          <FormField label="Appraisal">
            <TextInput
              value={appraisal}
              onChange={e => this.setState({ appraisal: e.currentTarget.value }) }
            />
          </FormField>
        </Box>
      </Box>

      <Box margin={{ bottom: 'medium' }}>
        <Button onClick={this.whitelist} primary alignSelf="end">Whitelist</Button>
      </Box>

      {is === 'loading' && 'Whitelisting...'}
      {is === 'success' && <Alert type="success">
        Successfully whitelisted NFT for Token ID {tokenId}</Alert>}
      {is === 'error' && <Alert type="error">
        <strong>Error whitelisting NFT for Token ID {tokenId}, see console for details</strong>
        {errorMsg && <div><br />{errorMsg}</div>}
      </Alert>}

    </Box>;
  }
}

export default WhitelistNFT;
