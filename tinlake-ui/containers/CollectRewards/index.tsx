import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Button } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { TransactionStatus } from '../../ducks/transactions'
import { loadCentChainConnected, UserRewardsState } from '../../ducks/userRewards'
import { centChainService } from '../../services/centChain'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { shortAddr } from '../../utils/shortAddr'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  tinlake: ITinlake
}

const CollectRewards: React.FC<Props> = ({ tinlake }: Props) => {
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { collectionData, collectionState } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const centAccountID = cWallet.accounts[0] ? centChainAddrToAccountId(cWallet.accounts[0].addrCentChain) : null

  React.useEffect(() => {
    if (centAccountID) {
      dispatch(loadCentChainConnected(centAccountID))
    }
  }, [centAccountID])

  const [status, setStatus] = React.useState<null | TransactionStatus>(null)
  const collect = async () => {
    const acc = cWallet.accounts[0]
    if (!acc) {
      return
    }
    setStatus('pending')
    const { web3FromSource } = await import('@polkadot/extension-dapp')
    const injector = await web3FromSource(acc.source)
    // TODO
    await centChainService().claimRADRewards(
      {
        addr: acc.addrCentChain,
        signer: injector.signer,
      },
      collectionData?.collectable!,
      []
    )
    setStatus('succeeded')
  }

  if (centAccountID === null) {
    return 'Please connect your wallet to proceed'
  }
  return (
    <>
      Your connected Centrifuge Chain address {shortAddr(accountIdToCentChainAddr(centAccountID))}{' '}
      {shortAddr(centAccountID)} has:
      <ul>
        <li>
          Collectable: {collectionState === 'loading' && 'loading...'}{' '}
          {collectionData?.collectable && `${toPrecision(baseToDisplay(collectionData.collectable, 18), 4)} RAD`}
        </li>
        <li>
          Collected: {collectionState === 'loading' && 'loading...'}{' '}
          {collectionData?.collected && `${toPrecision(baseToDisplay(collectionData.collected, 18), 4)} RAD`}
        </li>
      </ul>
      {collectionState === 'found' && !new BN(collectionData?.collectable || 0).isZero() && (
        <Button
          label={`Collect RAD rewards`}
          disabled={status === 'unconfirmed' || status === 'pending'}
          onClick={collect}
        />
      )}
    </>
  )
}

export default CollectRewards
