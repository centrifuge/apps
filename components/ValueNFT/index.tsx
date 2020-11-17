import * as React from 'react'
import { Box, FormField, TextInput, Button, Anchor, DateInput } from 'grommet'
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
import styled from 'styled-components'

interface Props extends TransactionProps {
  tinlake: ITinlake
  tokenId: string
  registry: string
  auth: AuthState
  loadProxies?: () => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const DAYS = 24 * 60 * 60 * 1000

const ValueNFT: React.FC<Props> = (props: Props) => {
  const [registry, setRegistry] = React.useState('')
  const [tokenId, setTokenId] = React.useState('')
  const [value, setValue] = React.useState('800000000000000000000')
  const [riskGroup, setRiskGroup] = React.useState('1')
  const [maturityDate, setMaturityDate] = React.useState(new Date(Date.now() + 30 * DAYS).toISOString()) // ISO8601

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

  const [statusValNFT, , setTxIdValNFT] = useTransactionState()
  const [statusSetMat, , setTxIdSetMat] = useTransactionState()

  const valueNFT = async () => {
    await props.ensureAuthed!()

    const nftFeedId = await props.tinlake.getNftFeedId(registry, tokenId)

    const txId = await props.createTransaction(`Value NFT ${tokenId.slice(0, 4)}...`, 'updateNftFeed', [
      props.tinlake,
      nftFeedId,
      value,
      riskGroup,
    ])
    setTxIdValNFT(txId)
  }

  const updateMaturityDate = async () => {
    await props.ensureAuthed!()

    const nftFeedId = await props.tinlake.getNftFeedId(registry, tokenId)

    const txId = await props.createTransaction(
      `Set maturity date for NFT ${tokenId.slice(0, 4)}...`,
      'setMaturityDate',
      [props.tinlake, nftFeedId, Math.floor(new Date(maturityDate).getTime() / 1000)]
    )
    setTxIdSetMat(txId)
  }

  React.useEffect(() => {
    setTokenId(props.tokenId || '')
    setRegistry(props.registry || '')
    getNFT(props.registry, props.tokenId)
  }, [props])

  if (statusValNFT === 'unconfirmed' || statusValNFT === 'pending') {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Updating NFT value and risk score...'} />
  }

  if (statusSetMat === 'unconfirmed' || statusSetMat === 'pending') {
    return <Spinner height={'calc(100vh - 89px - 84px)'} message={'Updating NFT maturity date...'} />
  }

  return (
    <Box>
      <Alert pad={{ horizontal: 'medium' }} type="info">
        <p>Tinlake requires you to have your non-fungible token ("NFT") valued and a maturity date set.</p>
        <p>In this demo, you can assign a value and a risk score to the NFT as well as set the maturity date.</p>
        <p>
          Note that this functionality is only available on Kovan Testnet. On Mainnet, NFTs are valued by underwriters
          and oracles.
        </p>
      </Alert>

      {!props.auth.permissions?.canSetRiskScore ? (
        <Alert margin={{ top: 'medium' }} pad={{ horizontal: 'medium' }} type="error">
          <p>You need to be an admin to value NFTs.</p>
        </Alert>
      ) : (
        <>
          <Box direction="row" gap="large" margin={{ vertical: 'large' }}>
            <b>Please paste your Token ID and corresponding registry address below to value an NFT:</b>
          </Box>

          <Box direction="row" gap="large" margin={{ vertical: 'large' }} align="center">
            <Col>
              <FormField label="Collateral Token Registry Address">
                <TextInput
                  value={registry || ''}
                  onChange={onRegistryAddressValueChange}
                  // disabled={status === 'unconfirmed' || status === 'pending'}
                />
              </FormField>
            </Col>

            <Col>
              <FormField label="Token ID">
                <TextInput
                  value={tokenId}
                  onChange={onTokenIdValueChange}
                  // disabled={status === 'unconfirmed' || status === 'pending'}
                />
              </FormField>
            </Col>

            <Col />
          </Box>

          <Box direction="row" gap="large" margin={{ vertical: 'large' }} align="center">
            <Col>
              <FormField label="Value">
                <NumberInput
                  value={baseToDisplay(value, 18)}
                  precision={18}
                  onValueChange={({ value }) => setValue(displayToBase(value, 18))}
                  // disabled={status === 'unconfirmed' || status === 'pending'}
                />
              </FormField>
            </Col>

            <Col>
              <FormField label="Risk Group">
                <NumberInput
                  value={riskGroup}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRiskGroup(e.currentTarget.value)}
                  precision={0}
                  // disabled={status === 'unconfirmed' || status === 'pending'}
                />
              </FormField>
            </Col>

            <Col>
              <Button
                onClick={valueNFT}
                primary
                label="Value NFT"
                // disabled={!nft || status === 'unconfirmed' || status === 'pending'}
              />
            </Col>
          </Box>

          {statusValNFT === 'succeeded' && (
            <Alert pad={{ horizontal: 'medium' }} type="success">
              Successfully valued NFT for Token ID {tokenId}
              <p>
                Please set the maturity date or{' '}
                <PoolLink href={{ pathname: '/assets/issue', query: { tokenId, registry } }}>
                  <Anchor>proceed to asset financing</Anchor>
                </PoolLink>{' '}
                your NFT.
              </p>
              <p> Your NFT ID will automatically be pasted in the respective field.</p>
            </Alert>
          )}

          <Box direction="row" gap="large" margin={{ vertical: 'large' }} align="center">
            <Col>
              <FormField label="Maturity Date">
                <DateInput
                  value={maturityDate}
                  format="YYYY-MM-DD"
                  onChange={(event: any) => {
                    setMaturityDate(event.value)
                  }}
                  // disabled={status === 'unconfirmed' || status === 'pending'}
                />
              </FormField>
            </Col>

            <Col />

            <Col>
              <Button
                onClick={updateMaturityDate}
                primary
                label="Set Maturity Date"
                // disabled={!nft || status === 'unconfirmed' || status === 'pending'}
              />
            </Col>
          </Box>

          {statusSetMat === 'succeeded' && (
            <Alert pad={{ horizontal: 'medium' }} type="success">
              Successfully set maturity date for NFT for Token ID {tokenId}
              <p>
                Please value the NFT or{' '}
                <PoolLink href={{ pathname: '/assets/issue', query: { tokenId, registry } }}>
                  <Anchor>proceed to asset financing</Anchor>
                </PoolLink>{' '}
                your NFT.
              </p>
              <p> Your NFT ID will automatically be pasted in the respective field.</p>
            </Alert>
          )}
        </>
      )}

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

const Col = styled.div`
  flex: 1 0 0;
`
