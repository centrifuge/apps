import { Tooltip } from '@centrifuge/axis-tooltip'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Select } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { AuthState } from '../../ducks/auth'
import { CentChainWalletState, InjectedAccount } from '../../ducks/centChainWallet'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { loadSubgraph } from '../../ducks/userRewards'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { isCentChainAddr } from '../../services/centChain/isCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

let interval: number | null = null

const SetCentAccount: React.FC<Props> = ({ createTransaction, tinlake }: Props) => {
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { address: ethAddr } = useSelector<any, AuthState>((state: any) => state.auth)
  const [selectedCentAcc, selectCentAcc] = React.useState<InjectedAccount>()

  React.useEffect(() => {
    selectCentAcc(cWallet.accounts[0])
  }, [cWallet.accounts[0]?.addrCentChain])

  const dispatch = useDispatch()

  const [status, , setTxId] = useTransactionState()

  const set = async () => {
    if (!selectedCentAcc || !isCentChainAddr(selectedCentAcc.addrCentChain)) {
      return
    }
    const txId = await createTransaction(
      `Link account ${shortAddr(selectedCentAcc.addrCentChain)}`,
      'updateClaimRADAccountID',
      [tinlake, centChainAddrToAccountId(selectedCentAcc.addrCentChain)]
    )
    setTxId(txId)
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      if (!ethAddr) {
        throw new Error('ethAddr is required to update cent chain account')
      }

      // poll changes
      dispatch(loadSubgraph(ethAddr))
      if (!interval) {
        interval = setInterval(async () => {
          dispatch(loadSubgraph(ethAddr))
        }, 2000)
      }
    }
  }, [status, ethAddr])

  React.useEffect(
    () => () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    },
    [ethAddr]
  )

  const disabled =
    status === 'unconfirmed' ||
    status === 'pending' ||
    !selectedCentAcc ||
    !isCentChainAddr(selectedCentAcc.addrCentChain)

  if (status === 'succeeded') {
    return (
      <div>
        Your Centrifuge Chain account has been successfully linked to your Ethereum account.
        <br />
        <br />
        It may take a few minutes for that information to load. This page will automatically refresh once done.
      </div>
    )
  }

  return (
    <div>
      Select the Centrifuge Chain account you want to link to your Ethereum account below.{' '}
      <strong>This step cannot be undone. Please make sure to link the correct account.</strong>
      <br />
      <br />
      <div>
        <Select
          options={cWallet.accounts}
          value={selectedCentAcc?.addrCentChain}
          valueKey="addrCentChain"
          valueLabel={
            selectedCentAcc ? (
              <Box pad="xsmall" style={{ textAlign: 'left' }}>
                {selectedCentAcc.name && (
                  <div>
                    <strong>{selectedCentAcc.name}</strong>
                  </div>
                )}
                <div>{selectedCentAcc.addrCentChain}</div>
              </Box>
            ) : (
              ''
            )
          }
          labelKey={({ name, addrCentChain }: InjectedAccount) => (
            <div style={{ textAlign: 'left' }}>
              {name && (
                <div>
                  <strong>{name}</strong>
                </div>
              )}
              <div>{addrCentChain}</div>
            </div>
          )}
          onChange={({ option }) => selectCentAcc(option)}
        />
      </div>
      <br />
      <Tooltip
        title="Unexpected/wrong addresses?"
        description={`Your address may show up ${
          selectedCentAcc ? `as ${shortAddr(selectedCentAcc.addrInjected)}` : 'differently'
        } in the Polkadot extension. In the extension settings, change the display address format to "Centrifuge Chain" to see your address in the right format.`}
      >
        <Small>Unexpected/wrong addresses?</Small>
      </Tooltip>
      <Box>
        <Button
          primary
          label={status === 'unconfirmed' || status === 'pending' ? `Linking account` : `Link account`}
          onClick={set}
          margin={{ left: 'auto', top: 'medium' }}
          disabled={disabled}
        />
      </Box>
    </div>
  )
}

export default connect((state) => state, { createTransaction })(SetCentAccount)

const Small = styled.small`
  font-size: 11px;
`
