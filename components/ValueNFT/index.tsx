import * as React from 'react'
import { Box, FormField, TextInput, Button, Anchor } from 'grommet'
import { connect } from 'react-redux'
import { baseToDisplay, displayToBase, ITinlake, NFT } from '@centrifuge/tinlake-js'
import { createTransaction, useTransactionState, TransactionProps } from '../../ducks/transactions'
import { getNFT as getNFTAction } from '../../services/tinlake/actions'
import { AuthState, loadProxies, ensureAuthed } from '../../ducks/auth'
import Alert from '../Alert'
import NftData from '../NftData'
import { Spinner } from '@centrifuge/axis-spinner'
import { PoolLink } from '../PoolLink'
import NumberInput from '../NumberInput'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'
import BN from 'bn.js'

interface Props extends TransactionProps {
  tinlake: ITinlakeV3 | ITinlake
  tokenId: string
  registry: string
  auth: AuthState
  loadProxies?: () => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const ValueNFT: React.FC<Props> = (props: Props) => {
  const [registry, setRegistry] = React.useState('')
  const [tokenId, setTokenId] = React.useState('')
  const [value, setValue] = React.useState('800000000000000000000')
  const [riskGroup, setRiskGroup] = React.useState('1')

  const [nft, setNft] = React.useState<NFT | null>(null)
  const [nftError, setNftError] = React.useState('')

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
      const result = await getNFTAction(currentRegistry, props.tinlake as ITinlake, currentTokenId)
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

  const valueNFT = async () => {
    await props.ensureAuthed!()

    const nftFeedId = await props.tinlake.getNftFeedId(registry, tokenId)

    const txId = await props.createTransaction(`Value NFT ${tokenId.slice(0, 4)}...`, 'updateNftFeed', [
      props.tinlake as ITinlake,
      nftFeedId,
      value,
      riskGroup,
    ])
    setTxId(txId)
  }

  React.useEffect(() => {
    setTokenId(props.tokenId || '')
    setRegistry(props.registry || '')
    getNFT(props.registry, props.tokenId)
  }, [props])

  if (status === 'unconfirmed' || status === 'pending') {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Minting...'} />
  }

  return (
    <Box>
      {status === 'succeeded' && (
        <Alert pad={{ horizontal: 'medium' }} type="success">
          Successfully valued NFT for Token ID {tokenId}
          <p>
            <PoolLink href={{ pathname: '/assets/issue', query: { tokenId, registry } }}>
              <Anchor>Please proceed to asset financing</Anchor>
            </PoolLink>{' '}
            your NFT.
          </p>
          <p> Your NFT ID will automatically be pasted in the respective field.</p>
        </Alert>
      )}

      {status !== 'succeeded' && (
        <Alert pad={{ horizontal: 'medium' }} type="info">
          <p>Tinlake requires you to have your non-fungible token ("NFT") valued.</p>
          <p>In this demo, you can assign a value and a risk score to the NFT.</p>
          <p>
            Note that this functionality is only available on Kovan Testnet. On Mainnet, NFTs are valued by underwriters
            and oracles.
          </p>
        </Alert>
      )}

      <Box direction="row" gap="large" margin={{ vertical: 'large' }}>
        <b>Please paste your Token ID and corresponding registry address below to value an NFT:</b>
      </Box>

      <Box direction="row" gap="large" justify="evenly">
        <FormField label="Collateral Token Registry Address">
          <TextInput
            value={registry || ''}
            onChange={onRegistryAddressValueChange}
            // disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </FormField>

        <FormField label="Token ID">
          <TextInput
            value={tokenId}
            onChange={onTokenIdValueChange}
            // disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </FormField>

        <FormField label="Value">
          <NumberInput
            value={baseToDisplay(value, 18)}
            precision={18}
            onValueChange={({ value }) => setValue(displayToBase(value, 18))}
            // disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </FormField>

        <FormField label="Risk Group">
          <NumberInput
            value={riskGroup}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRiskGroup(e.currentTarget.value)}
            precision={0}
            // disabled={status === 'unconfirmed' || status === 'pending'}
          />
        </FormField>

        <Button
          onClick={valueNFT}
          primary
          label="Value NFT"
          // disabled={!nft || status === 'unconfirmed' || status === 'pending'}
        />
      </Box>

      <Box>
        {nftError && (
          <Alert type="error" margin={{ vertical: 'large' }}>
            {nftError}{' '}
          </Alert>
        )}
        {nft && props.auth?.address && <NftData data={nft} authedAddr={props.auth.address} />}
      </Box>
    </Box>
  )
}

export default connect((state) => state, { loadProxies, ensureAuthed, createTransaction })(ValueNFT)
