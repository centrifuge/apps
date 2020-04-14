import * as React from 'react';
import { Box, FormField, TextInput, Button, Text } from 'grommet';
import Alert from '../../../components/Alert';
import NftData from '../../../components/NftData';
import { getNFT, issue, NFT, TinlakeResult } from '../../../services/tinlake/actions'
import { authTinlake } from "../../../services/tinlake"
import { Spinner } from '@centrifuge/axis-spinner';
import LoanView from '../View';
import { AuthState } from '../../../ducks/auth';

interface Props {
  tinlake: any;
  tokenId: string;
  auth: AuthState;
}

interface State {
  nft: NFT | null;
  nftError: string;
  tokenId: string;
  loanId: string
  errorMsg: string;
  is: string;
}

class IssueLoan extends React.Component<Props, State> {

  // handlers
  onTokenIdValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value
    await this.setState({
      tokenId: currentTokenId,
      nft: null,
      nftError: ''
    })
    await this.getNFT(currentTokenId)
  }

  getNFT = async (currentTokenId: string) => {
    const { tinlake } = this.props;
    if (currentTokenId && currentTokenId.length > 0) {
      const result = await getNFT(tinlake, currentTokenId);
      const { tokenId, nft, errorMessage } = result as Partial<{ tokenId: string, nft: NFT, errorMessage: string }>
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

  issueLoan = async () => {
    const { tinlake } = this.props;
    const { tokenId } = this.state;
    this.setState({ is: 'loading' });

    try {
      await authTinlake();
      // issue loan
      const result: TinlakeResult = await issue(tinlake, tokenId);
      if (result.errorMsg) {
        this.setState({ is: 'error', errorMsg });
        return;
      }
      const loanId = result.data;
      this.setState({ loanId });
      this.setState({ is: 'success' });
    } catch (e) {
      this.setState({ is: 'error', errorMsg: e.message });
    }
  }

  componentWillMount() {
    const { tokenId } = this.props;
    this.setState({ tokenId: tokenId || '' }, () => {
      if (tokenId) { this.getNFT(tokenId); }
    });
  }

  render() {
    const { tokenId, is, nft, errorMsg, nftError, loanId } = this.state;
    const { tinlake, auth } = this.props;
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
              <b>Please paste your NFT ID below to open a loan:</b>
            </Box>}
        </Box>
   
      
      {is !== 'success' &&
      <Box>
        <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
          <Box basis={'1/4'} gap="medium">
            <FormField label="Token ID">
              <TextInput
                value={tokenId}
                onChange={this.onTokenIdValueChange}
                disabled={is === 'success'}
              />
            </FormField>
          </Box>
          <Box gap="medium" align="end">
            <Button onClick={this.issueLoan} primary label="Open loan" disabled={is === 'loading' || is === 'success' || !nft} />
          </Box>
        </Box>
      </Box>
      }

      {loanId ?
        <Box margin={{ bottom: 'medium', top: 'large' }}> <LoanView auth={auth} tinlake={tinlake} loanId={loanId} /></Box>
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
    </Box>
  }
}


export default IssueLoan;


