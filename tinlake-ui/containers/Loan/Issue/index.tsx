import { NFT } from '@centrifuge/tinlake-js'
import { Box, Button, FormField, TextInput } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../../components/Alert'
import NftData from '../../../components/NftData'
import { Pool } from '../../../config'
import { AuthState, ensureAuthed, loadProxies } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { getNFT as getNFTAction } from '../../../services/tinlake/actions'
import LoanView from '../View'

interface Props extends TransactionProps {
  tinlake: any
  poolConfig: Pool
  tokenId: string
  registry: string
  auth: AuthState
  loadProxies?: () => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const IssueLoan: React.FC<Props> = (props: Props) => {
  const [registry, setRegistry] = React.useState('')
  const [tokenId, setTokenId] = React.useState('')

  const [nft, setNft] = React.useState<NFT | null>(null)
  const [nftError, setNftError] = React.useState('')

  const [loanId, setLoanId] = React.useState('')

  // handlers
  const onTokenIdValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value
    setTokenId(currentTokenId)
    setNft(null)
    setNftError('')
    await getNFT(registry, currentTokenId)
  }

  const onRegistryAddressValueChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentRegistryAddress = event.currentTarget.value
    setRegistry(currentRegistryAddress)
    setNft(null)
    setNftError('')
    await getNFT(currentRegistryAddress, tokenId)
  }

  const getNFT = async (currentRegistry: string, currentTokenId: string) => {
    if (currentTokenId && currentTokenId.length > 0) {
      const result = await getNFTAction(currentRegistry, props.tinlake, currentTokenId)
      const { tokenId, nft, errorMessage } = result as Partial<{ tokenId: string; nft: NFT; errorMessage: string }>
      if (tokenId !== currentTokenId) {
        return
      }
      if (errorMessage) {
        setNftError(errorMessage)
        return
      }
      nft && setNft(nft)
    }
  }

  const [status, result, setTxId] = useTransactionState()

  const issueLoan = async () => {
    await props.ensureAuthed!()

    const txId = await props.createTransaction(`Lock NFT ${tokenId.slice(0, 4)}...`, 'issue', [
      props.tinlake,
      tokenId,
      registry,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      const loanId = result.data
      setLoanId(loanId)
      props.loadProxies && props.loadProxies()
    }
  }, [status])

  React.useEffect(() => {
    setTokenId(props.tokenId || '')
    setRegistry(props.registry || '')
    getNFT(props.registry, props.tokenId)
  }, [props])

  const disabled = status === 'unconfirmed' || status === 'pending' || status === 'succeeded'

  return (
    <Box>
      <Box pad="medium" elevation="small" round="xsmall" background="white">
        <Box>
          <Box direction="row" gap="medium" margin={{ top: 'medium' }}>
            <b>Please paste your Token ID and corresponding registry address below to finance an asset:</b>
          </Box>
        </Box>

        <Box>
          <Box direction="row" gap="medium" margin={{ bottom: 'medium', top: 'large' }}>
            <Box basis={'1/3'} gap="medium">
              <FormField label="Collateral Token Registry Address">
                <TextInput value={registry || ''} onChange={onRegistryAddressValueChange} disabled={disabled} />
              </FormField>
            </Box>

            <Box basis={'1/3'} gap="medium">
              <FormField label="Token ID">
                <TextInput value={tokenId} onChange={onTokenIdValueChange} disabled={disabled} />
              </FormField>
            </Box>
            <Box basis={'1/3'} gap="medium" align="end">
              <Button onClick={issueLoan} primary label="Lock NFT" disabled={!nft || disabled} />
            </Box>
          </Box>
        </Box>
      </Box>

      {loanId ? (
        <Box margin={{ bottom: 'medium', top: 'large' }}>
          {' '}
          <LoanView tinlake={props.tinlake} poolConfig={props.poolConfig} loanId={loanId} />
        </Box>
      ) : (
        <Box>
          {nftError && (
            <Alert type="error" margin={{ vertical: 'large' }}>
              {nftError}{' '}
            </Alert>
          )}
          {nft && <NftData data={nft} />}
        </Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { loadProxies, ensureAuthed, createTransaction })(IssueLoan)
