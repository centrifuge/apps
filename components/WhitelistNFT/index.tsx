import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import { Box, FormField, TextInput, Button, Heading } from 'grommet';
import Alert from '../Alert';
import Link from 'next/link';
import SecondaryHeader from '../SecondaryHeader';
import { LinkPrevious } from 'grommet-icons';

const SUCCESS_STATUS = '0x1';

interface Props {
  tinlake: Tinlake;
  tokenId: string;
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

  componentWillMount() {
    this.setState({ tokenId: this.props.tokenId || '' });
  }

  whitelist = async () => {
    this.setState({ is: 'loading' });

    const { tinlake } = this.props;
    const { tokenId, principal, appraisal } = this.state;
    const addresses = tinlake.contractAddresses;

    try {
      // admit
      const nftOwner = await tinlake.ownerOfNFT(tokenId);

      console.log(`NFT owner of tokenId ${tokenId} is ${nftOwner}`);

      // console.log(`Calling tinlake.adminAdmit(${addresses['NFT_COLLATERAL']}, ` +
      //   `${tokenId}, ${principal}, ${nftOwner})`);
      const res2 = await tinlake.adminAdmit(addresses['NFT_COLLATERAL'], tokenId, principal,
                                            nftOwner);

      console.log('admit result');
      console.log(res2.txHash);

      if (res2.status !== SUCCESS_STATUS || res2.events[0].event.name !== 'Transfer') {
        console.log(res2);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
        return;
      }

      const loanId = res2.events[0].data[2].toString();
      console.log(`Loan id: ${loanId}`);

      // const nftOwner2 = await tinlake.ownerOfNFT(tokenId);
      // console.log(`NFT owner: ${nftOwner2}`);
      // const loanOwner2 = await tinlake.ownerOfLoan(loanId);
      // console.log(`loan owner: ${loanOwner2}`);

      // appraise
      // console.log(`Calling tinlake.adminAppraise(${loanId}, ${appraisal})`);
      const res3 = await tinlake.adminAppraise(loanId, appraisal);

      console.log('appraisal results');
      console.log(res3.txHash);

      if (res3.status !== SUCCESS_STATUS) {
        console.log(res3);
        this.setState({ is: 'error', errorMsg: JSON.stringify(res3) });
        return;
      }

      // const nftOwner3 = await tinlake.ownerOfNFT(tokenId);
      // console.log(`NFT owner: ${nftOwner3}`);
      // const loanOwner3 = await tinlake.ownerOfLoan(loanId);
      // console.log(`loan owner: ${loanOwner3}`);

      this.setState({ is: 'success' });
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { tokenId, principal, appraisal, is, errorMsg } = this.state;

    console.log('tokenId', tokenId);

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href="/admin">
            <LinkPrevious />
          </Link>
          <Heading level="3">Whitelist NFT</Heading>
        </Box>

        <Button onClick={this.whitelist} primary label="Whitelist" />
      </SecondaryHeader>

      <Box pad={{ horizontal: 'medium' }}>
        {is === 'loading' && 'Whitelisting...'}
        {is === 'success' && <Alert type="success">
          Successfully whitelisted NFT for Token ID {tokenId}</Alert>}
        {is === 'error' && <Alert type="error">
          <strong>Error whitelisting NFT for Token ID {tokenId}, see console for details</strong>
          {errorMsg && <div><br />{errorMsg}</div>}
        </Alert>}

        <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
          <Box basis={'1/4'} gap="medium">
            <FormField label="NFT ID">
              <TextInput
                value={tokenId}
                onChange={e => this.setState({ tokenId: e.currentTarget.value })}
              />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Appraisal">
              <TextInput
                value={appraisal}
                onChange={e => this.setState({ appraisal: e.currentTarget.value })}
              />
            </FormField>
          </Box>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Principal">
              <TextInput
                value={principal}
                onChange={e => this.setState({ principal: e.currentTarget.value })}
              />
            </FormField>
          </Box>
        </Box>
      </Box>
    </Box>;
  }
}

export default WhitelistNFT;
