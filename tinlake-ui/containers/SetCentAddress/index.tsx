import { ITinlake } from '@centrifuge/tinlake-js'
import { Button } from 'grommet'
import * as React from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import Alert from '../../components/Alert'
import { AuthState } from '../../ducks/auth'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { createTransaction, TransactionProps, useTransactionState } from '../../ducks/transactions'
import { loadCentAddr } from '../../ducks/userRewards'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { isCentChainAddr } from '../../services/centChain/isCentChainAddr'
import { shortAddr } from '../../utils/shortAddr'

interface Props extends TransactionProps {
  tinlake: ITinlake
}

const SetCentAddress: React.FC<Props> = ({ createTransaction, tinlake }: Props) => {
  const dispatch = useDispatch()
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const auth = useSelector<any, AuthState>((state: any) => state.auth)
  const { address: ethAddr } = auth

  React.useEffect(() => {
    if (ethAddr) {
      dispatch(loadCentAddr(ethAddr, tinlake))
    }
  }, [ethAddr])

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

  React.useEffect(() => {
    if (ethAddr && status === 'succeeded') {
      dispatch(loadCentAddr(ethAddr, tinlake))
    }
  }, [status])

  const disabled =
    status === 'unconfirmed' || status === 'pending' || !!(walletCentAddr && !isCentChainAddr(walletCentAddr))

  return (
    <>
      {walletCentAddr && !isCentChainAddr(walletCentAddr) && (
        <Alert type="error">{walletCentAddr} is not a valid Centrifuge Chain address.</Alert>
      )}
      {walletCentAddr && (
        <>
          <Button
            label={`Set ${shortAddr(walletCentAddr)} as your reward claim address`}
            disabled={disabled}
            onClick={() => set(walletCentAddr)}
          />
        </>
      )}
    </>
  )
}

export default connect((state) => state, { createTransaction })(SetCentAddress)
