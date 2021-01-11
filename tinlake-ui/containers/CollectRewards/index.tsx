import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { CentChainWalletState } from '../../ducks/centChainWallet'
import { TransactionStatus } from '../../ducks/transactions'
import { loadCentChain, loadCentChainConnected, UserRewardsState } from '../../ducks/userRewards'
import { centChainService } from '../../services/centChain'
import { accountIdToCentChainAddr } from '../../services/centChain/accountIdToCentChainAddr'
import { centChainAddrToAccountId } from '../../services/centChain/centChainAddrToAccountId'
import { createBufferProofFromClaim, createTree, newClaim } from '../../utils/radRewardProofs'
import { shortAddr } from '../../utils/shortAddr'
import { toPrecision } from '../../utils/toPrecision'
import CentChainWalletDialog from '../CentChainWalletDialog'

interface Props {}

const CollectRewards: React.FC<Props> = ({}: Props) => {
  const cWallet = useSelector<any, CentChainWalletState>((state: any) => state.centChainWallet)
  const { data, collectionData, collectionState, claims } = useSelector<any, UserRewardsState>(
    (state: any) => state.userRewards
  )
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

    if (!claims) {
      throw new Error('claims must exist to collect')
    }

    const claim = claims?.find((c) => c.accountID === centChainAddrToAccountId(acc.addrCentChain))

    if (!claim) {
      throw new Error('claim must exist to collect')
    }

    const tree = createTree(claims.map((c) => newClaim(c)))
    const proof = createBufferProofFromClaim(tree, newClaim(claim))

    try {
      await centChainService().claimRADRewards(claim.accountID, claim.balance, proof)
      await Promise.all([dispatch(loadCentChainConnected(centAccountID!)), dispatch(loadCentChain())])
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
    // TODO replace this with using linked cent address as opposed to connected.
    return (
      <Box pad="medium">
        <CentChainWalletDialog />
      </Box>
    )
  }

  if (
    collectionState === null ||
    collectionState === 'loading' ||
    collectionData === null ||
    collectionData?.collectable === null ||
    collectionData?.collected === null
  ) {
    return <Box pad="medium">Loading collectable rewards...</Box>
  }

  const uncollected =
    collectionData && collectionData?.collectable !== null && collectionData?.collected !== null
      ? new BN(collectionData?.collectable).sub(new BN(collectionData?.collected))
      : null

  return (
    <>
      <Box pad="medium">
        {uncollected && !uncollected?.isZero() ? (
          <>
            {(status === null || status === 'unconfirmed' || status === 'failed' || status === 'pending') && (
              <>
                🎉 You have {toPrecision(baseToDisplay(uncollected, 18), 4)} uncollected RAD rewards.
                {uncollected.gt(new BN(data?.totalEarnedRewards || '0')) && (
                  <>
                    <br />
                    <br />
                    Your uncollected rewards on this address can be higher than the rewards you earned on the connected
                    Ethereum address, e. g. if you have set this Centrifuge Chain address as recipient for multiple
                    Ethereum addresses.
                  </>
                )}
              </>
            )}
            {status === 'succeeded' && (
              <Alert type="success" style={{ marginTop: 24 }}>
                You have collected {toPrecision(baseToDisplay(uncollected, 18), 4)} RAD. If you still have active
                investments, please come back tomorrow or at a later time to collect more rewards.
              </Alert>
            )}
            {status === 'failed' && error && (
              <Alert type="error" style={{ marginTop: 24 }}>
                Error collecting rewards. {error}
              </Alert>
            )}
          </>
        ) : (
          <>
            👍 You have collected all your rewards. If you still have active investments, please come back tomorrow or
            at a later time to collect more rewards.
          </>
        )}
        {!new BN(collectionData.collected).isZero() && (
          <>
            <>
              <br />
              <br />
              🏆 You have collected so far {toPrecision(baseToDisplay(collectionData.collected, 18), 4)} RAD as rewards.
            </>
            {new BN(collectionData.collected).gt(new BN(data?.totalEarnedRewards || '0')) && (
              <>
                <br />
                <br />
                Your collected rewards on this address can be higher than the rewards you earned on the connected
                Ethereum address, e. g. if you have set this Centrifuge Chain address as recipient for multiple Ethereum
                addresses.
              </>
            )}
          </>
        )}
        {debug && (
          <Alert type="info">
            <h3>Debug: Collection</h3>
            <ul>
              <li>
                Centrifuge Chain Address: {shortAddr(accountIdToCentChainAddr(centAccountID))} (Account ID{' '}
                {shortAddr(centAccountID)})
              </li>
              <li>
                Collectable on Subgraph:
                {`${toPrecision(baseToDisplay(collectionData.collectable, 18), 4)} RAD`}
              </li>
              <li>
                Collected on Centrifuge Chain:
                {`${toPrecision(baseToDisplay(collectionData.collected, 18), 4)} RAD`}
              </li>
            </ul>
          </Alert>
        )}
      </Box>
      <RewardStripe uncollected={uncollected || new BN(0)}>
        <Button
          margin={{ left: 'auto' }}
          label={`Collect`}
          disabled={!!uncollected && !uncollected.isZero() && (status === 'unconfirmed' || status === 'pending')}
          onClick={collect}
        />
      </RewardStripe>
    </>
  )
}

export default CollectRewards

const RewardStripe = ({ uncollected, children }: React.PropsWithChildren<{ uncollected: BN }>) => (
  <Cont direction="row" pad={{ vertical: 'small', horizontal: 'medium' }}>
    <Box>
      <Label>Your uncollected rewards</Label>
      <Number>{toPrecision(baseToDisplay(uncollected, 18), 0)} RAD</Number>
    </Box>
    {children}
  </Cont>
)

const Cont = styled(Box)`
  background: #fcba59;
  border-radius: 0 0 6px 6px;
`

const Label = styled.div`
  font-size: 10px;
  font-weight: 500;
  height: 14px;
  line-height: 14px;
`

const Number = styled.div`
  font-size: 20px;
  font-weight: 500;
  height: 32px;
  line-height: 32px;
`
