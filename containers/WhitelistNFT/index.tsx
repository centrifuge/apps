import * as React from 'react';
import Tinlake, { baseToDisplay, displayToBase, interestRateToFee } from 'tinlake';
import { Box, FormField, TextInput, Button, Heading, Text } from 'grommet';
import Alert from '../../components/Alert';
import Link from 'next/link';
import SecondaryHeader from '../../components/SecondaryHeader';
import { LinkPrevious } from 'grommet-icons';
import { connect } from 'react-redux';
import NftData from '../../components/NftData';
import { authTinlake } from '../../services/tinlake';
import { getNFT, NFT } from '../../services/nft'
import { Spinner } from '@centrifuge/axis-spinner';
import NumberInput from '../../components/NumberInput';

const SUCCESS_STATUS = '0x1';

interface Props {
  tinlake: Tinlake;
}

interface State {
  nft: NFT | null; 
  nftError: string;
  tokenId: string;
  principal: string;
  appraisal: string;
  interestRate: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

class WhitelistNFT extends React.Component<Props, State> {
  state: State = {
    nft: null,
    nftError: '',
    tokenId: '',
    principal: '0',
    appraisal: '0',
    interestRate: '0',
    is: null,
    errorMsg: '',
  };

  componentWillMount() {
  }

  //handlers
  onTokenIdValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value
    await this.setState({ 
      tokenId: currentTokenId, 
      nft: null, 
      nftError: ''
    })
    await this.getNFT(currentTokenId)
  }

  whitelist = async () => {
    const { tinlake } = this.props;
    const { tokenId, principal, appraisal, interestRate } = this.state;
    const addresses = tinlake.contractAddresses;
    if (principal === '0') {
      this.setState({ is: 'error', errorMsg: 'Principal cannot be 0' });
      //needs to be implemented on the contract level first
    } /*else if (principal > appraisal) {
      this.setState({ is: 'error', errorMsg: 'Principal can not be heigher then appraisal'  });
    }*/
    else{
      this.setState({ is: 'loading' });
      try {
        await authTinlake();
        // init fee
        const fee = interestRateToFee(interestRate);
        const feeExists = await tinlake.existsFee(fee);
        if (!feeExists) {
          const res = await tinlake.initFee(fee);
          if (res.status !== SUCCESS_STATUS) {
            this.setState({ is: 'error', errorMsg: JSON.stringify(res) });
            return;
          }
        }
        // admit
        const nftOwner = await tinlake.ownerOfNFT(tokenId);
        const res2 = await tinlake.whitelist(addresses['NFT_COLLATERAL'], tokenId, principal, appraisal, fee, nftOwner);
        if (res2.status !== SUCCESS_STATUS || res2.events[0].event.name !== 'Transfer') {
          this.setState({ is: 'error', errorMsg: JSON.stringify(res2) });
          return;
        }

        const loanId = res2.events[0].data[2].toString();
        console.log(`Loan id: ${loanId}`);
        this.setState({ is: 'success' });
      } catch (e) {
        console.log(e);
        this.setState({ is: 'error', errorMsg: e.message });
      }
    }
  }

  getNFT = async (currentTokenId: string) => {
    const { tinlake} = this.props;
    if (currentTokenId && currentTokenId.length > 0) {
      const result = await getNFT(tinlake, currentTokenId);
      const {tokenId, nft, errorMessage } = result as Partial< {tokenId:string, nft:NFT, errorMessage:string} >
      if (tokenId !== this.state.tokenId) {
        return;
      }
      if (errorMessage) {
        this.setState({ nftError: errorMessage });
        return;
      }
      nft && this.setState({ nft })
    }
  }

  render() {
    const { tinlake } = this.props;
    const { tokenId, principal, appraisal, interestRate, is, errorMsg, nft, nftError } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href="/admin">
            <LinkPrevious />
          </Link>
          <Heading level="3">Whitelist NFT</Heading>
        </Box>

        <Button onClick={this.whitelist} primary label="Whitelist"
          disabled={is === 'loading' || is === 'success' || !nft} />
      </SecondaryHeader>

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Initiating the whitelisting process. Please confirm the pending transactions in MetaMask, and do not leave this page until all transactions have been confirmed.'} />
      :
        <Box pad={{ horizontal: 'medium' }}>
          {is === 'success' && <Alert type="success">
            Successfully whitelisted NFT for Token ID {tokenId}</Alert>}
          {is === 'error' && <Alert type="error">
            <Text weight="bold">
              Error whitelisting NFT for Token ID {tokenId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}

          <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
            <Box basis={'1/4'} gap="medium">
              <FormField label="NFT ID">
                <TextInput
                  value={tokenId}
                  onChange={this.onTokenIdValueChange}
                  disabled={is === 'success'}
                />
              </FormField>
            </Box>
            <Box basis={'1/4'} gap="medium">
              <FormField label="Appraisal">
                <NumberInput
                  value={baseToDisplay(appraisal, 18)} suffix=" DAI" precision={18} autoFocus
                  onValueChange={({ value }) =>
                    this.setState({ appraisal: displayToBase(value, 18) })}
                  disabled={is === 'success'}
                />
              </FormField>
            </Box>
            <Box basis={'1/4'} gap="medium">
              <FormField label="Principal">
                <NumberInput
                  value={baseToDisplay(principal, 18)} suffix=" DAI" precision={18}
                  onValueChange={({ value }) => {
                    this.setState({ principal: displayToBase(value, 18) });
                  }}
                  disabled={is === 'success'}
                />
              </FormField>
            </Box>
            <Box basis={'1/4'} gap="medium">
              <FormField label="Interest Rate (Yearly)">
                <NumberInput
                  value={interestRate} suffix=" %" precision={2}
                  onValueChange={({ value }) =>
                    this.setState({ interestRate: value })}
                  disabled={is === 'success'}
                />
              </FormField>
            </Box>
          </Box>

          {nftError && <Alert type="error" margin={{ vertical: 'large' }}>
          { nftError } </Alert>}
          {nft &&
            <NftData data={nft} authedAddr={tinlake.ethConfig.from} />}
        </Box>
      }
    </Box>;
  }
}

export default connect(state => state )(WhitelistNFT);
