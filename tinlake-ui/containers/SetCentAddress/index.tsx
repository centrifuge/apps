import { ITinlake } from '@centrifuge/tinlake-js'
import { Button } from 'grommet'
import * as React from 'react'
import { connect, useSelector } from 'react-redux'
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
      {walletCentAddr && !isCentChainAddr(walletCentAddr) && (
        <Alert type="error">{walletCentAddr} is not a valid Centrifuge Chain address.</Alert>
      )}
      {walletCentAddr && (
        <div>
          You can now set the connected Centrifuge Chain address {shortAddr(walletCentAddr)} as the receiver of all your
          RAD rewards. Please make sure you have stored your private key/seed mnemonic in a secure place. If you loose
          access to this account, your rewards will be lost.
          <div>
            <Button label={`Set reward address`} disabled={disabled} onClick={() => set(walletCentAddr)} />
          </div>
        </div>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(SetCentAddress)
