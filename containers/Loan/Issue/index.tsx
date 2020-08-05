import * as React from 'react'
import { Box, FormField, TextInput, Button, Text } from 'grommet'
import Alert from '../../../components/Alert'
import NftData from '../../../components/NftData'
import { connect } from 'react-redux'
import { Spinner } from '@centrifuge/axis-spinner'
import LoanView from '../View'
import { AuthState, loadProxies, ensureAuthed } from '../../../ducks/auth'
import { NFT } from 'tinlake'
import { createTransaction, TxProps, TransactionState, getTransaction } from '../../../ducks/asyncTransactions'
import { getNFT } from '../../../services/tinlake/actions'

interface Props extends TxProps {
  tinlake: any
  tokenId: string
  registry: string
  auth: AuthState
  loadProxies?: () => Promise<void>
  ensureAuthed?: () => Promise<void>
  asyncTransactions?: TransactionState
}

interface State {
  nft: NFT | null
  registry: string
  nftError: string
  tokenId: string
  loanId: string
  txId: string | undefined
}

class IssueLoan extends React.Component<Props, State> {
  state: State = {
    nft: null,
    registry: '',
    nftError: '',
    tokenId: '',
    loanId: '',
    txId: undefined,
  }

  // handlers
  onTokenIdValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value
    await this.setState({
      tokenId: currentTokenId,
      nft: null,
      nftError: '',
    })
    await this.getNFT()
  }

  onRegistryAddressValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentRegistryAddress = event.currentTarget.value
    await this.setState({
      registry: currentRegistryAddress,
      nft: null,
      nftError: '',
    })
    await this.getNFT()
  }

  getNFT = async () => {
    const { tinlake } = this.props
    const { registry } = this.state
    const currentTokenId = this.state.tokenId
    if (currentTokenId && currentTokenId.length > 0) {
      const result = await getNFT(registry, tinlake, currentTokenId)
      const { tokenId, nft, errorMessage } = result as Partial<{ tokenId: string; nft: NFT; errorMessage: string }>
      if (tokenId !== currentTokenId) {
        return
      }
      if (errorMessage) {
        this.setState({ nftError: errorMessage })
        return
      }
      nft && this.setState({ nft })
    }
  }

  issueLoan = async () => {
    const { tinlake, ensureAuthed, createTransaction } = this.props
    const { tokenId, registry } = this.state
    await ensureAuthed!()

    const txId = await createTransaction(`Finance asset`, 'issue', [tinlake, tokenId, registry])
    this.setState({ txId })
  }

  is() {
    return getTransaction(this.props.asyncTransactions, this.state.txId)?.status
  }

  errorMsg() {
    return getTransaction(this.props.asyncTransactions, this.state.txId)?.result.errorMsg
  }

  componentWillMount() {
    const { tokenId, registry } = this.props
    this.setState({ tokenId: tokenId || '', registry: registry || '' })
  }

  componentDidMount() {
    this.getNFT()
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.state.txId &&
      prevProps.asyncTransactions?.active[this.state.txId] !== this.props.asyncTransactions?.active[this.state.txId]
    ) {
      const tx = getTransaction(this.props.asyncTransactions, this.state.txId)
      if (tx?.status === 'succeeded') {
        const loanId = tx.result.data
        this.setState({ loanId })
        this.props.loadProxies && this.props.loadProxies()
      }
    }
  }

  render() {
    const is = this.is()
    const { tokenId, registry, nft, nftError, loanId } = this.state
    const { tinlake } = this.props
    return (
      <Box>
        {is === 'unconfirmed' || is === 'pending' ? (
          <Spinner
            height={'calc(100vh - 89px - 84px)'}
            message={
              'Initiating the asset financing process. Please confirm the pending transactions and do not leave this page until all transactions have been confirmed.'
            }
          />
        ) : (
          <Box>
            <Box>
              {is === 'failed' && (
                <Alert type="error">
                  <Text weight="bold">Error financing asset for Token ID {tokenId}, see console for details</Text>
                  {this.errorMsg() && (
                    <div>
                      <br />
                      {this.errorMsg()}
                    </div>
                  )}
                </Alert>
              )}
              {is !== 'succeeded' && (
                <Box direction="row" gap="medium" margin={{ top: 'medium' }}>
                  <b>Please paste your Token ID and corresponding registry address below to finance an asset:</b>
                </Box>
              )}
            </Box>

            {is !== 'succeeded' && (
              <Box>
                <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
                  <Box basis={'1/3'} gap="medium">
                    <FormField label="Collateral Token Registry Address">
                      <TextInput value={registry || ''} onChange={this.onRegistryAddressValueChange} disabled={false} />
                    </FormField>
                  </Box>

                  <Box basis={'1/3'} gap="medium">
                    <FormField label="Token ID">
                      <TextInput value={tokenId} onChange={this.onTokenIdValueChange} disabled={false} />
                    </FormField>
                  </Box>
                  <Box basis={'1/3'} gap="medium" align="end">
                    <Button onClick={this.issueLoan} primary label="Finance Asset" disabled={!nft} />
                  </Box>
                </Box>
              </Box>
            )}

            {loanId ? (
              <Box margin={{ bottom: 'medium', top: 'large' }}>
                {' '}
                <LoanView tinlake={tinlake} loanId={loanId} />
              </Box>
            ) : (
              <Box>
                {nftError && (
                  <Alert type="error" margin={{ vertical: 'large' }}>
                    {nftError}{' '}
                  </Alert>
                )}
                {nft && <NftData data={nft} authedAddr={tinlake.ethConfig.from} />}
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }
}

export default connect((state) => state, { loadProxies, ensureAuthed, createTransaction })(IssueLoan)
