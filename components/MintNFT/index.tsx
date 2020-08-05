import * as React from 'react'
import { displayToBase, baseToDisplay } from 'tinlake'
import { Box, FormField, TextInput, Button, Heading, Anchor, Text } from 'grommet'
import Alert from '../Alert'
import SecondaryHeader from '../SecondaryHeader'
import { BackLink } from '../BackLink'
import { Spinner } from '@centrifuge/axis-spinner'
import NumberInput from '../NumberInput'
import { PoolLink } from '../PoolLink'
import { connect } from 'react-redux'
import { ensureAuthed } from '../../ducks/auth'
import { TransactionState, createTransaction, getTransaction, TxProps } from '../../ducks/asyncTransactions'

const NFT_REGISTRY = '0xac0c1ef395290288028a0a9fdfc8fdebebe54a24'

interface Props extends TxProps {
  tinlake: any
  ensureAuthed?: () => Promise<void>
  asyncTransactions?: TransactionState
}

interface State {
  tokenId: string
  txId: string | undefined
  amount: string
  assetType: string
  referenceId: string
  errorMsg: string
}

// const SUCCESS_STATUS = '0x1'

class MintNFT extends React.Component<Props, State> {
  state: State = {
    tokenId: this.generateTokenId(),
    txId: undefined,
    referenceId: '',
    amount: '1000.00',
    assetType: 'Invoice',
    errorMsg: '',
  }

  generateTokenId() {
    let id = ''
    for (let i = 0; i < 32; i = i + 1) {
      id += Math.round(Math.random() * 16)
    }
    return id
  }

  is() {
    return getTransaction(this.props.asyncTransactions, this.state.txId)?.status
  }

  mint = async () => {
    const { tinlake, ensureAuthed, createTransaction } = this.props
    const { referenceId, assetType, amount, tokenId } = this.state

    const registry = NFT_REGISTRY
    {
      await ensureAuthed!()
      const base = displayToBase(baseToDisplay(amount, 2), 2)

      const txId = await createTransaction(`Mint NFT ${referenceId}`, 'mintNFT', [
        tinlake,
        registry,
        tinlake.ethConfig.from,
        tokenId,
        referenceId,
        base,
        assetType,
      ])

      this.setState({ txId })
    }
  }

  render() {
    const is = this.is()
    const { tokenId, errorMsg, referenceId, assetType, amount } = this.state
    const registry = NFT_REGISTRY
    return (
      <Box>
        <SecondaryHeader>
          <Box direction="row" gap="small" align="center">
            <BackLink href="/assets" />
            <Heading level="3">Mint NFT</Heading>
          </Box>
        </SecondaryHeader>

        {is === 'unconfirmed' || is === 'pending' ? (
          <Spinner height={'calc(100vh - 89px - 84px)'} message={'Minting...'} />
        ) : (
          <Box>
            {is === 'succeeded' && (
              <Alert pad={{ horizontal: 'medium' }} type="success">
                Successfully minted NFT for Token ID {tokenId}
                <p>
                  <PoolLink href={{ pathname: '/assets/issue', query: { tokenId, registry } }}>
                    <Anchor>Please proceed to asset financing</Anchor>
                  </PoolLink>{' '}
                  your NFT.
                </p>
                <p> Your NFT ID will automatically be pasted in the respective field.</p>
                <p>
                  If you want to finance an asset, <b>please make sure to copy your Token ID!</b>
                </p>
              </Alert>
            )}
            {is === 'failed' && (
              <Alert pad={{ horizontal: 'medium' }} type="error">
                <Text weight="bold">Error minting NFT for Token ID {tokenId}, see console for details</Text>
                {errorMsg && (
                  <div>
                    <br />
                    {errorMsg}
                  </div>
                )}
              </Alert>
            )}

            {is === undefined && (
              <Alert pad={{ horizontal: 'medium' }} type="info">
                <p>
                  Tinlake requires you to have a non-fungible token ("NFT") to deposit as collateral. An NFT is an
                  on-chain, digital representation of an underlying real-world asset, such as an invoice, a mortgage or
                  music royalties.
                </p>
                <p>
                  In this demo, you can mint a test NFT reflecting an sample invoice worth USD 1.000 into your wallet.
                  Please fill in a "NFT Reference" as a unique identifier for your invoice NFT below. Then proceed with
                  Mint NFT. The NFT will be minted into your wallet and on the next screen you will be provided with the
                  Token ID of this NFT.
                </p>
                <p>
                  <b>Please store or copy this Token ID, as it will be used again to finance an asset on Tinlake.</b>
                </p>
                <p>
                  If you already have a token ID,{' '}
                  <PoolLink href={'/assets/issue'}>
                    <Anchor>please proceed to open a financing</Anchor>
                  </PoolLink>
                  .
                </p>
                <p>
                  Note that this functionality is only available on Kovan Testnet. On Mainnet NFTs are minted using
                  Centrifuge’s P2P Protocol.
                </p>
              </Alert>
            )}

            <Box direction="row" gap="large" margin={{ vertical: 'large' }}>
              <b>Please specify metadata of NFT:</b>
            </Box>

            <Box direction="row" gap="large" justify="evenly">
              {is === 'succeeded' && (
                <FormField label="Token ID">
                  <TextInput value={this.state.tokenId} disabled={true} />
                </FormField>
              )}
              <FormField label="NFT Reference">
                <TextInput
                  value={referenceId}
                  onChange={(e) => this.setState({ referenceId: e.currentTarget.value })}
                  disabled={is === 'succeeded'}
                />
              </FormField>
              <FormField label="Asset Type">
                <TextInput value={assetType} disabled />
              </FormField>
              <FormField label="Invoice Amount">
                <NumberInput suffix=" USD" value={amount} disabled />
              </FormField>
              <Button primary onClick={this.mint} label="Mint NFT" disabled={is === 'succeeded'} />
            </Box>
          </Box>
        )}
      </Box>
    )
  }
}

export default connect((state) => state, { ensureAuthed, createTransaction })(MintNFT)
