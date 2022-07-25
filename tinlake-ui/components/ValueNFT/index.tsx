import { Spinner } from '@centrifuge/axis-spinner'
import { baseToDisplay, displayToBase, NFT } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, DateInput, FormField, TextInput } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { ensureAuthed, loadProxies, useAuth } from '../../ducks/auth'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { getNFT as getNFTAction } from '../../services/tinlake/actions'
import { usePool } from '../../utils/usePool'
import Alert from '../Alert'
import { Card } from '../Card'
import NftData from '../NftData'
import NumberInput from '../NumberInput'
import { PoolLink } from '../PoolLink'
import { useTinlake } from '../TinlakeProvider'

interface Props extends TransactionProps {
  tokenId: string
  registry: string
  loadProxies?: () => Promise<void>
  ensureAuthed?: () => Promise<void>
}

const DAYS = 24 * 60 * 60 * 1000

const ValueNFT: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const auth = useAuth()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

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
      const result = await getNFTAction(currentRegistry, tinlake, currentTokenId)
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

    const nftFeedId = await tinlake.getNftFeedId(registry, tokenId)

    const txId = await props.createTransaction(`Value NFT ${tokenId.slice(0, 4)}...`, 'updateNftFeed', [
      tinlake,
      nftFeedId,
      value,
      riskGroup,
    ])
    setTxIdValNFT(txId)
  }

  const updateMaturityDate = async () => {
    await props.ensureAuthed!()

    const nftFeedId = await tinlake.getNftFeedId(registry, tokenId)

    const txId = await props.createTransaction(
      `Set maturity date for NFT ${tokenId.slice(0, 4)}...`,
      'setMaturityDate',
      [tinlake, nftFeedId, Math.floor(new Date(maturityDate).getTime() / 1000)]
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
        <p>Tinlake requires you to have your non-fungible token (&quot;NFT&quot;) valued and a maturity date set.</p>
        <p>In this demo, you can assign a value and a risk score to the NFT as well as set the maturity date.</p>
        <p>
          Note that this functionality is only available on Kovan Testnet. On Mainnet, NFTs are valued by underwriters
          and oracles.
        </p>
      </Alert>

      {!auth.permissions?.canSetRiskScore && !(poolData?.adminLevel && poolData.adminLevel >= 2) ? (
        <Alert margin={{ top: 'medium' }} pad={{ horizontal: 'medium' }} type="error">
          <p>You need to be an admin to value NFTs.</p>
        </Alert>
      ) : (
        <Card p="medium" py="medium">
          <Box direction="row" gap="large">
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
              {maturityDate}
              <FormField label="Maturity Date">
                <DateInput
                  value={maturityDate}
                  onChange={(event: any) => {
                    console.log(event.value)
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
        </Card>
      )}
      <Box>
        {nftError && (
          <Alert type="error" margin={{ vertical: 'large' }}>
            {nftError}{' '}
          </Alert>
        )}
        {nft && <NftData data={nft} />}
      </Box>
    </Box>
  )
}

export default connect(null, { loadProxies, ensureAuthed, createTransaction })(ValueNFT)

const Col = styled.div`
  flex: 1 0 0;
`
