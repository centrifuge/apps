import * as React from 'react';
import { Box, FormField, TextInput, Button, Text } from 'grommet';
import Alert from '../../../components/Alert';
import NftData from '../../../components/NftData';
import { connect } from 'react-redux';
import { getNFT, issue, TinlakeResult } from '../../../services/tinlake/actions';
import { authTinlake } from '../../../services/tinlake';
import { Spinner } from '@centrifuge/axis-spinner';
import LoanView from '../View';
import { AuthState, loadProxies } from '../../../ducks/auth';
import { NFT } from 'tinlake';

interface Props {
  tinlake: any;
  tokenId: string;
  registry: string;
  auth: AuthState;
  loadProxies?: () => Promise<void>;
}

interface State {
  nft: NFT | null;
  registry: string;
  nftError: string;
  tokenId: string;
  loanId: string;
  errorMsg: string;
  is: string | null;
}

class IssueLoan extends React.Component<Props, State> {
  state: State = {
    nft: null,
    registry: '',
    nftError: '',
    tokenId: '',
    loanId: '',
    errorMsg: '',
    is: null
  };

  // handlers
  onTokenIdValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value;
    this.setState({
      tokenId: currentTokenId,
      nft: null,
      nftError: ''
    });
    await this.getNFT();
  }

  onRegistryAddressValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentRegistryAddress = event.currentTarget.value;
    this.setState({
      registry: currentRegistryAddress,
      nft: null,
      nftError: ''
    });
    await this.getNFT();
  }

  getNFT = async () => {
    const { tinlake } = this.props;
    const { registry } = this.state;
    const currentTokenId = this.state.tokenId;
    if (currentTokenId  && currentTokenId .length > 0) {
      const result = await getNFT(registry, tinlake, currentTokenId);
      const { tokenId, nft, errorMessage } = result as Partial<{ tokenId: string, nft: NFT, errorMessage: string }>;
      if (tokenId !== currentTokenId) {
        return;
      }
      if (errorMessage) {
        this.setState({ nftError: errorMessage });
        return;
      }
      nft && this.setState({ nft });
    }
  }

  issueLoan = async () => {
    const { tinlake, loadProxies } = this.props;
    const { tokenId } = this.state;
    this.setState({ is: 'loading' });

    try {
      await authTinlake();
      // issue loan
      const { registry } = this.state;
      const result: TinlakeResult = await issue(tinlake, tokenId, registry);
      if (result.errorMsg) {
        this.setState({ is: 'error', errorMsg: result.errorMsg });
        return;
      }
      const loanId = result.data;
      this.setState({ loanId });
      this.setState({ is: 'success' });
      loadProxies && loadProxies();
    } catch (e) {
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  componentWillMount() {
    const { tokenId, registry } = this.props;
    this.setState({ tokenId: tokenId || '', registry: registry || '' });
  }

  componentDidMount() {
    this.getNFT();
  }
  render() {
    const { tokenId, registry, is, nft, errorMsg, nftError, loanId } = this.state;
    const { tinlake } = this.props;
    return <Box>
      {is === 'loading' ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Initiating the opening loan process. Please confirm the pending transactions in MetaMask, and do not leave this page until all transactions have been confirmed.'} />
        :
        <Box>
        <Box>
          {is === 'error' && <Alert type="error">
            <Text weight="bold">
              Error opening loan for Token ID {tokenId}, see console for details</Text>
            {errorMsg && <div><br />{errorMsg}</div>}
          </Alert>}
          {is !== 'success' &&
            <Box direction="row" gap="medium" margin={{ top: 'medium' }}>
              <b>Please paste your Token ID and corresponding registry address below to open a loan:</b>
            </Box>}
        </Box>

      {is !== 'success' &&
      <Box>
        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/3'} gap="medium">
            <FormField label="Collateral Token Registry Address">
              <TextInput
                value={registry || ''}
                onChange={this.onRegistryAddressValueChange}
                disabled={is === 'success'}
              />
            </FormField>
          </Box>

          <Box basis={'1/3'} gap="medium">
            <FormField label="Token ID">
              <TextInput
                value={tokenId}
                onChange={this.onTokenIdValueChange}
                disabled={is === 'success'}
              />
            </FormField>
          </Box>
          <Box basis={'1/3'} gap="medium" align="end">
            <Button onClick={this.issueLoan} primary label="Open loan" disabled={is === 'loading' || is === 'success' || !nft} />
          </Box>
        </Box>
      </Box>
      }

      {loanId ?
        <Box margin={{ bottom: 'medium', top: 'large' }}> <LoanView tinlake={tinlake} loanId={loanId} /></Box>
        :
        <Box>
          {nftError && <Alert type="error" margin={{ vertical: 'large' }}>
            {nftError} </Alert>
          }
          {nft &&
            <NftData data={nft} authedAddr={tinlake.ethConfig.from} />
          }
        </Box>
      }
      </Box>
    }
    </Box>;
  }
}

export default connect(state => state, { loadProxies })(IssueLoan);
