import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '../../components/Alert'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { TransactionStatus } from '../../ducks/transactions'
import { loadCentChainConnected, UserRewardsState } from '../../ducks/userRewards'
import { centChainService } from '../../services/centChain'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { shortAddr } from '../../utils/shortAddr'
import { toPrecision } from '../../utils/toPrecision'

interface Props {}

const CollectRewards: React.FC<Props> = ({}: Props) => {
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
  const [error, setError] = React.useState<null | string>(null)
  const collect = async () => {
    const acc = cWallet.accounts[0]
    if (!acc) {
      return
    }
    setStatus('pending')
    setError(null)
    try {
      await centChainService().claimRADRewards(
        centChainAddrToAccountId(acc.addrCentChain),
        collectionData?.collectable!,
        []
      )
      setStatus('succeeded')
    } catch (e) {
      setStatus('failed')
      setError(e)
    }
  }

  const {
    query: { debug },
  } = useRouter()

  if (centAccountID === null) {
    return null
  }

  if (
    collectionState === null ||
    collectionState === 'loading' ||
    collectionData === null ||
    collectionData?.collectable === null ||
    collectionData?.collected === null
  ) {
    return <div>Loading collectable rewards...</div>
  }

  const uncollected =
    collectionData && collectionData?.collectable !== null && collectionData?.collected !== null
      ? new BN(collectionData?.collectable).sub(new BN(collectionData?.collected))
      : null

  return (
    <>
      {uncollected && !uncollected?.isZero() ? (
        <>
          {(status === null || status === 'unconfirmed' || status === 'failed' || status === 'pending') && (
            <>
              <div>🎉 You have {toPrecision(baseToDisplay(uncollected, 18), 4)} uncollected RAD rewards.</div>
              <Button label={`Collect`} disabled={status === 'unconfirmed' || status === 'pending'} onClick={collect} />
            </>
          )}
          {status === 'succeeded' && (
            <Alert type="success">
              You have collected {toPrecision(baseToDisplay(uncollected, 18), 4)} RAD. If you still have active
              investments, please come back tomorrow or at a later time to collect more.
            </Alert>
          )}
          {status === 'failed' && error && <Alert type="error">Error collecting rewards. {error}</Alert>}
        </>
      ) : (
        <div>
          👍 You have collected all your rewards. If you still have active investments, please come back tomorrow or at
          a later time.
        </div>
      )}
      {!new BN(collectionData.collected).isZero() && (
        <div>
          🏆 You have collected so far
          {toPrecision(baseToDisplay(collectionData.collected, 18), 4)} RAD as rewards.
        </div>
      )}
      {debug && (
        <>
          <div>
            Centrifuge Chain Address: {shortAddr(accountIdToCentChainAddr(centAccountID))} (Account ID{' '}
            {shortAddr(centAccountID)})
          </div>
          <div>
            Collectable on Subgraph:
            {`${toPrecision(baseToDisplay(collectionData.collectable, 18), 4)} RAD`}
          </div>
          <div>
            Collected on Centrifuge Chain:
            {`${toPrecision(baseToDisplay(collectionData.collected, 18), 4)} RAD`}
          </div>
        </>
      )}
    </>
  )
}

export default CollectRewards
