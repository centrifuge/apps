import { Tooltip } from '@centrifuge/axis-tooltip'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Select } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { AuthState } from '../../ducks/auth'
import { CentChainWalletState, InjectedAccount } from '../../ducks/centChainWallet'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { loadEthLink, loadSubgraph, UserRewardsState } from '../../ducks/userRewards'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { isCentChainAddr } from '../../services/centChain/isCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'
import { Warning } from '../Investment/View/styles'

const HelpIcon = styled.img`
  height: 16px;
  width: 16px;
  vertical-align: text-top;
`

const HelpText = styled.span`
  padding-left: 6px;
  font-weight: 800;
`

const LinkingWarning = styled(Warning)`
  margin-bottom: 16px;
`

interface Props extends TransactionProps {
  tinlake: ITinlake
}

let interval: ReturnType<typeof setTimeout> | null = null

const SetCentAccount: React.FC<Props> = ({ createTransaction, tinlake }: Props) => {
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
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
      'updateClaimCFGAccountID',
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
      dispatch(loadEthLink(ethAddr, tinlake))
      dispatch(loadSubgraph(ethAddr))
      if (!interval) {
        interval = setInterval(async () => {
          dispatch(loadSubgraph(ethAddr))
        }, 2000)
      }
    }
  }, [status, ethAddr])

  React.useEffect(() => {
    if (ethAddr) {
      dispatch(loadEthLink(ethAddr, tinlake))
    }

    return function cleanup() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
  }, [ethAddr])

  if (userRewards.ethLinkState !== 'found') {
    return null
  }

  if (userRewards.ethLinkState === 'found' && userRewards.ethLink) {
    return (
      <div>
        Your Centrifuge Chain account {accountIdToCentChainAddr(userRewards.ethLink)} has been successfully linked to
        your Ethereum account.
        <br />
        <br />
        It may take a few minutes for that information to load. This page will automatically refresh once done.
        <br />
        <br />
        <Tooltip
          title="Why so slow?"
          description={`Communication between the Ethereum blockchain and our Centrifuge Chain is semi-automated. Every link transaction on Ethereum will be observed by a relayer, a proof will be generated, and that proof will be committed on Centrfiuge Chain. This process is running only once per day.`}
        >
          <Small>Why so slow?</Small>
        </Tooltip>
      </div>
    )
  }

  const disabled =
    status === 'unconfirmed' ||
    status === 'pending' ||
    !selectedCentAcc ||
    !isCentChainAddr(selectedCentAcc.addrCentChain)

  return (
    <div>
      Select the Centrifuge Chain account you want to link to your Ethereum account below. Note: To claim rewards, link
      your Centrifuge Chain account before redeeming your investment.
      <LinkingWarning>
        <HelpIcon src="/static/help-circle.svg" />
        <HelpText>Make sure to select the correct account – linking the account cannot be undone</HelpText>
      </LinkingWarning>
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
