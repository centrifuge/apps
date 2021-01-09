import { Tooltip } from '@centrifuge/axis-tooltip'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, FormField, TextInput } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { isCentChainAddr } from '../../services/centChain/isCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const SetCentAddress: React.FC<Props> = ({ createTransaction, tinlake }: Props) => {
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)

  const [status, , setTxId] = useTransactionState()

  const walletCentAddr = cWallet.accounts[0] ? cWallet.accounts[0].addrCentChain : null

  const set = async (addr: string) => {
    if (!walletCentAddr || !isCentChainAddr(addr)) {
      return
    }
    const txId = await createTransaction(
      `Set reward claim address: ${shortAddr(walletCentAddr)}`,
      'updateClaimRADAddress',
      [tinlake, centChainAddrToAccountId(addr)]
    )
    setTxId(txId)
  }

  const disabled =
    status === 'unconfirmed' || status === 'pending' || !!(walletCentAddr && !isCentChainAddr(walletCentAddr))

  return (
    <>
      {walletCentAddr && !isCentChainAddr(walletCentAddr || '') && (
        <Alert type="error">{walletCentAddr} is not a valid Centrifuge Chain address.</Alert>
      )}
      {walletCentAddr && (
        <div>
          You can now set your Centrifuge Chain address as the receiver of all your RAD rewards. Please make sure you
          use the right account, since this step cannot be undone.
          <FormField label="Your Centrifuge Chain address" margin={{ top: 'large', bottom: 'small' }} width="420px">
            <TextInput value={walletCentAddr} disabled={true} />
          </FormField>
          <Tooltip
            title="Unexpected/wrong address?"
            description={`Your address may show up as ${shortAddr(
              cWallet.accounts[0].addrInjected
            )} in the Polkadot extension. In the extension settings, change the display address format to "Centrifuge Chain" to see your address in the right format.`}
          >
            <Small>Unexpected/wrong address?</Small>
          </Tooltip>
          <Box>
            <Button
              primary
              label={`Set reward address`}
              onClick={() => set(walletCentAddr)}
              margin={{ left: 'auto', top: 'medium' }}
              disabled={disabled}
            />
          </Box>
        </div>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(SetCentAddress)

const Small = styled.small`
  font-size: 11px;
`
