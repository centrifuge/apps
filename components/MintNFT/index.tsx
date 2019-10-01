import * as React from 'react';
import Tinlake, { displayToBase, baseToDisplay } from 'tinlake';
import { Box, FormField, TextInput, Button, Heading, Anchor, Text } from 'grommet';
import Alert from '../Alert';
import Link from 'next/link';
import SecondaryHeader from '../SecondaryHeader';
import { LinkPrevious } from 'grommet-icons';
import { authTinlake } from '../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import NumberInput from '../NumberInput';

interface Props {
  tinlake: Tinlake;
}

interface State {
  tokenId: string;
  referenceId: string;
  amount: string;
  assetType: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

const SUCCESS_STATUS = '0x1'

class MintNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: this.generateTokenId(),
    referenceId: '',
    amount: '0',
    assetType: '',
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
    const { referenceId, amount, assetType } = this.state;
    if (referenceId === '' || assetType === '') {
      this.setState({ is: 'error', errorMsg: 'Both Reference ID and Asset Type must be defined.' });
    } else if (amount === '0') {
      this.setState({ is: 'error', errorMsg: 'Amount cannot be 0.' });
    } else {
      this.setState({ is: 'loading' });
      try {
        await authTinlake();

        const res = await this.props.tinlake.mintNFT(
          this.props.tinlake.ethConfig.from, this.state.tokenId, referenceId, amount, assetType);
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
    const { is, tokenId, errorMsg, referenceId, amount, assetType } = this.state;

    return <Box>
      <SecondaryHeader>
        <Box direction="row" gap="small" align="center">
          <Link href="/borrower">
            <LinkPrevious />
          </Link>
          <Heading level="3">Mint NFT</Heading>
        </Box>

        <Button primary onClick={this.mint} label="Mint NFT"
          disabled={is === 'loading' || is === 'success'} />
      </SecondaryHeader>

      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Minting...'} />
      :
        <Box pad={{ horizontal: 'xsmall' }}>
          {is === 'success' && <Alert type="success">
            Successfully minted NFT for Token ID {tokenId}.
            <b>Please make sure to copy your Token ID!</b>
            <Link href={`/admin/whitelist-nft?tokenId=${tokenId}`}>
              <Anchor>Then proceed to whitelisting</Anchor></Link></Alert>}
          {is === 'error' && <Alert type="error">
            <Text weight="bold">
              Error minting NFT for Token ID {tokenId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}
          <Box direction="row" justify="center" gap="large" margin={{ vertical: 'large' }}>
            <Box basis="1/3" gap="large">
              { is === 'success' && <FormField label="Token ID">
                <TextInput
                  value={this.state.tokenId}
                  disabled={true}
                />
              </FormField> }
              <FormField label="Reference ID">
                <TextInput
                  value={referenceId}
                  onChange={e => this.setState({ referenceId: e.currentTarget.value })}
                  disabled={is === 'success'}
                />
              </FormField>
              <FormField label="Asset Type">
                <TextInput
                  value={assetType}
                  onChange={e => this.setState({ assetType: e.currentTarget.value })}
                  disabled={is === 'success'}
                />
              </FormField>
              <FormField label="Amount">
                <NumberInput
                  precision={18}
                  suffix=" USD"
                  value={baseToDisplay(amount, 18)}
                  onValueChange={({ value }) => {
                    this.setState({ amount: displayToBase(value, 18) });
                  }}
                  disabled={is === 'success'}
                />
              </FormField>
            </Box>
          </Box>
        </Box>
      }
    </Box>;
  }
}

export default MintNFT;
