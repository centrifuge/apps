import * as React from 'react';
// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
import { Box, FormField, TextInput, Button } from 'grommet';
import Alert from '../Alert';

interface Props {
  tinlake: Tinlake;
}

interface State {
  tokenId: string;
  is: 'loading' | 'success' | 'error' | null;
  errorMsg: string;
}

const SUCCESS_STATUS = '0x1';

class MintNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: `0x${Math.floor(Math.random() * (10 ** 15))}`,
    is: null,
    errorMsg: '',
  };

  mint = async () => {
    this.setState({ is: 'loading' });

    try {
      const res = await this.props.tinlake.mintNFT(
          this.props.tinlake.ethConfig.from, this.state.tokenId);
      if (res.status === SUCCESS_STATUS && res.events[0].event.name === 'Transfer') {
        this.setState({ is: 'success' });
      } else {
        console.log(res);
        this.setState({ is: 'error' });
      }
    } catch (e) {
      console.log(e);
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  render() {
    const { is, tokenId, errorMsg } = this.state;

    return <Box pad="medium" style={{ backgroundColor: '#edf2f7', borderRadius: 18 }}>
      <h2>Mint an NFT</h2>

      <Box direction="row" gap="medium" margin={{ bottom: 'medium' }}>
        <Box basis={'1/4'} gap="medium">
          <FormField label="Token ID">
            <TextInput
              value={this.state.tokenId}
              onChange={e => this.setState({ tokenId: e.currentTarget.value }) }
            />
          </FormField>
        </Box>
      </Box>

      <Box margin={{ bottom: 'medium' }}>
        <Button primary onClick={this.mint} alignSelf="end">Mint NFT</Button>
      </Box>

      {is === 'loading' && 'Minting...'}
      {is === 'success' && <Alert type="success">
        Successfully minted NFT for Token ID {tokenId}</Alert>}
      {is === 'error' && <Alert type="error">
        <strong>Error minting NFT for Token ID {tokenId}, see console for details</strong>
        {errorMsg && <div><br />{errorMsg}</div>}
      </Alert>}
    </Box>;
  }
}

export default MintNFT;
