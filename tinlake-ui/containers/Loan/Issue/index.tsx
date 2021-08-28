import { NFT } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, FormField, TextInput } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { connect } from 'react-redux'
import Alert from '../../../components/Alert'
import NftData from '../../../components/NftData'
import { PoolLink } from '../../../components/PoolLink'
import { Pool } from '../../../config'
import { AuthState, ensureAuthed } from '../../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { getNFT as getNFTAction } from '../../../services/tinlake/actions'
import LoanView from '../View'

interface Props extends TransactionProps {
  tinlake: any
  poolConfig: Pool
  auth: AuthState
  ensureAuthed?: () => Promise<void>
}

const IssueLoan: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { tokenId: tokenIdParam, registry: registryParam }: { tokenId?: string; registry?: string } =
    router.query as any
  const [registry, setRegistry] = React.useState('')
  const [tokenId, setTokenId] = React.useState('')
  const inFlight = React.useRef<Promise<any>>()

  const [nft, setNft] = React.useState<NFT | null>(null)
  const [nftError, setNftError] = React.useState('')

  const [loanId, setLoanId] = React.useState('')

  // handlers
  const onTokenIdValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentTokenId = event.currentTarget.value
    setTokenId(currentTokenId)
  }

  const onRegistryAddressValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentRegistryAddress = event.currentTarget.value
    setRegistry(currentRegistryAddress)
  }

  const getNFT = async (currentRegistry: string, currentTokenId: string) => {
    if (currentTokenId && currentTokenId.length > 0) {
      setNft(null)
      setNftError('')
      const promise = getNFTAction(currentRegistry, props.tinlake, currentTokenId)
      inFlight.current = promise
      const result = await promise
      const { nft, error } = result as Partial<{ tokenId: string; nft: NFT; error: string }>
      if (inFlight.current !== promise) {
        return
      }
      if (error) {
        setNftError(error)
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
    }
  }, [status])

  React.useEffect(() => {
    if (!registryParam) return
    setRegistry(registryParam)
  }, [registryParam])

  React.useEffect(() => {
    if (!tokenIdParam) return
    setTokenId(tokenIdParam)
  }, [tokenIdParam])

  React.useEffect(() => {
    getNFT(registry, tokenId)
  }, [registry, tokenId])

  const disabled = status === 'unconfirmed' || status === 'pending' || status === 'succeeded'
  const wrongOwner = props.auth.address && nft && props.auth.address.toLowerCase() !== nft.nftOwner.toLowerCase()
  const canLockNFT = !disabled && nft && (!props.auth.address || !wrongOwner)

  return (
    <Box>
      {status === 'succeeded' && (
        <Alert pad={{ horizontal: 'medium' }} margin={{ bottom: 'medium' }} type="success">
          <p>
            Your NFT is succesfully locked. Please proceed to the{' '}
            <PoolLink href={{ pathname: '/assets' }}>
              <Anchor>Asset List</Anchor>
            </PoolLink>{' '}
            to finance this NFT.
          </p>
        </Alert>
      )}
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
              <Button onClick={issueLoan} primary label="Lock NFT" disabled={!canLockNFT} />
            </Box>
          </Box>
        </Box>

        {nftError && <Alert type="error">{nftError}</Alert>}
        {!disabled && wrongOwner && <Alert type="error">NFT not held in your wallet</Alert>}
      </Box>

      {loanId ? (
        <Box margin={{ bottom: 'medium', top: 'large' }}>
          {' '}
          <LoanView tinlake={props.tinlake} poolConfig={props.poolConfig} loanId={loanId} />
        </Box>
      ) : (
        <Box>{nft && <NftData data={nft} />}</Box>
      )}
    </Box>
  )
}

export default connect((state) => state, { ensureAuthed, createTransaction })(IssueLoan)
