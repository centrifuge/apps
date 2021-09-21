import { Box, Button, Select } from 'grommet'
import { CircleAlert } from 'grommet-icons'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { useTinlake } from '../../components/TinlakeProvider'
import { Tooltip } from '../../components/Tooltip'
import { useAuth } from '../../ducks/auth'
import { CentChainWalletState, InjectedAccount } from '../../ducks/centChainWallet'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { isCentChainAddr } from '../../services/centChain/isCentChainAddr'
import { useInterval } from '../../utils/hooks'
import { shortAddr } from '../../utils/shortAddr'
import { useEthLink } from '../../utils/useEthLink'
import { useUserRewardsSubgraph } from '../../utils/useUserRewards'
import { Warning } from '../Investment/View/styles'

const LinkingAlert = styled(CircleAlert)`
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

const SetCentAccount: React.FC<TransactionProps> = ({ createTransaction }: TransactionProps) => {
  const tinlake = useTinlake()
  const { refetch } = useUserRewardsSubgraph()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { address: ethAddr } = useAuth()
  const { data: ethLink, refetch: refetchEthLink } = useEthLink(ethAddr)
  const [selectedCentAcc, selectCentAcc] = React.useState<InjectedAccount>()

  React.useEffect(() => {
    selectCentAcc(cWallet.accounts[0])
  }, [cWallet.accounts[0]?.addrCentChain])

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

  useInterval(refetch, status === 'succeeded' && ethAddr ? 5000 : null)

  React.useEffect(() => {
    if (status === 'succeeded') {
      refetchEthLink()
    }
  }, [status])

  if (ethLink === undefined) {
    return null
  }

  if (ethLink) {
    return (
      <div>
        Your Centrifuge Chain account {accountIdToCentChainAddr(ethLink)} has been successfully linked to your Ethereum
        account.
        <br />
        <br />
        It may take a few minutes for that information to load. This page will automatically refresh once done.
        <br />
        <br />
        <Tooltip
          title="Why so slow?"
          description={`Communication between the Ethereum blockchain and our Centrifuge Chain is semi-automated. Every link transaction on Ethereum will be observed by a relayer, a proof will be generated, and that proof will be committed on Centrfiuge Chain. This process is running only once per day.`}
          underline
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
        <LinkingAlert />
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
        underline
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
