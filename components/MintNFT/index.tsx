import * as React from 'react';
import { displayToBase, baseToDisplay } from 'tinlake';
import { Box, FormField, TextInput, Button, Heading, Anchor, Text } from 'grommet';
import Alert from '../Alert';
import Link from 'next/link';
import SecondaryHeader from '../SecondaryHeader';
import { BackLink } from '../BackLink';
import { authTinlake } from '../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import NumberInput from '../NumberInput';
import config from '../../config';

interface Props {
  tinlake: any;
}

interface State {
  tokenId: string;
  amount: string;
  assetType: string;
  referenceId: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

const SUCCESS_STATUS = '0x1';

class MintNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: this.generateTokenId(),
    referenceId: '',
    amount: '1000.00',
    assetType: 'Invoice',
    is: null,
    errorMsg: ''
  };

  generateTokenId() {
    let id = '';
    for (let i = 0; i < 32; i = i + 1) {
      id += Math.round(Math.random() * 16);
    }
    return id;
  }

  mint = async () => {
    const { referenceId, assetType, amount, tokenId } = this.state;
    const registry = config.contractAddresses.COLLATERAL_NFT;
    {
      this.setState({ is: 'loading' });
      try {
        await authTinlake();
        const base = displayToBase(baseToDisplay(amount, 2), 2);
        const res = await this.props.tinlake.mintNFT(registry, this.props.tinlake.ethConfig.from, tokenId, referenceId, base, assetType);
        if (res.status === SUCCESS_STATUS && res.events[0].event.name === 'Transfer') {
          this.setState({ is: 'success' });
        } else {
          this.setState({ is: 'error' });
        }
      } catch (e) {
        console.log(e);
        this.setState({ is: 'error', errorMsg: e.message });
      }
    }
  }

  render() {
    const { is, tokenId, errorMsg, referenceId, assetType, amount } = this.state;
    const registry = config.contractAddresses.COLLATERAL_NFT;
    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <BackLink href="/borrower" />
          <Heading level="3">Mint NFT</Heading>
        </Box>
      </SecondaryHeader>

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Minting...'} />
      :
        <Box >
          {is === 'success' && <Alert pad={{horizontal : 'medium'}} type="success">
            Successfully minted NFT for Token ID {tokenId}
            <p>
              <Link href={{ pathname: '/loans/issue', query: { tokenId, registry } }}>
                <Anchor>Please proceed to loan opening</Anchor>
              </Link> your NFT.</p>
            <p> Your NFT ID will automatically be pasted in the respective field.</p>
            <p>If you want to open a loan, <b>please make sure to copy your Token ID!</b></p>
         </Alert>}
          {is === 'error' && <Alert pad={{horizontal : 'medium'}} type="error">
            <Text weight="bold">
              Error minting NFT for Token ID {tokenId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}

          {is === null && <Alert pad={{horizontal : 'medium'}} type="info">
            Tinlake requires you to have a non-fungible token ("NFT") to deposit as collateral.
             An NFT is an on-chain, digital representation of an underlying real-world asset, such as an invoice, a mortgage or music royalties.
            <p>In this demo, you can mint a test NFT reflecting an sample invoice worth USD 1.000 into your wallet. Please fill in a "NFT Reference" as a unique identifier for your invoice NFT below. Then proceed with Mint NFT.
              The NFT will be minted into your wallet and on the next screen you will be provided with the Token ID of this NFT.</p>
           <b>Please store or copy this Token ID, as it will be used again to open a loan on Tinlake.</b>
            <p>If you already have a token ID, <Link href={'/loans/issue'}>
              <Anchor>please proceed to loan opening</Anchor></Link>.</p>
          </Alert>}

          <Box direction="row" gap="large" margin={{ vertical:'large' }}>
            <b>Please specify metadata of NFT:</b>
          </Box>

          <Box direction="row" gap="large" justify="evenly">
              { is === 'success' && <FormField label="Token ID">
                <TextInput
                  value={this.state.tokenId}
                  disabled={true}
                />
              </FormField> }
              <FormField label="NFT Reference">
                <TextInput
                  value={referenceId}
                  onChange={e => this.setState({ referenceId: e.currentTarget.value })}
                  disabled={is === 'success'}
                />
              </FormField>
              <FormField label="Asset Type">
                <TextInput
                  value={assetType}
                  disabled
                />
              </FormField>
              <FormField label="Invoice Amount">
                <NumberInput
                  suffix=" USD"
                  value={amount}
                  disabled
                />
              </FormField>
            <Button primary onClick={this.mint} label="Mint NFT"
                    disabled={is === 'loading' || is === 'success'} />
            </Box>
          </Box>
      }
    </Box>;
  }
}

export default MintNFT;
