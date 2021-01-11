import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { TransactionStatus } from '../../ducks/transactions'
import { loadCentChain, UserRewardsLink, UserRewardsState } from '../../ducks/userRewards'
import { centChainService } from '../../services/centChain'
import { createBufferProofFromClaim, createTree, newClaim } from '../../utils/radRewardProofs'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  activeLink: UserRewardsLink
}

const CollectRewards: React.FC<Props> = ({ activeLink }: Props) => {
  const { data, claims } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const [status, setStatus] = React.useState<null | TransactionStatus>(null)
  const [error, setError] = React.useState<null | string>(null)
  const collect = async () => {
    setStatus('pending')
    setError(null)

    if (!claims) {
      throw new Error('claims must exist to collect')
    }

    const claim = claims?.find((c) => c.accountID === activeLink.centAccountID)

    if (!claim) {
      throw new Error('claim must exist to collect')
    }

    const tree = createTree(claims.map((c) => newClaim(c)))
    const proof = createBufferProofFromClaim(tree, newClaim(claim))

    try {
      await centChainService().claimRADRewards(claim.accountID, claim.balance, proof)
      await dispatch(loadCentChain())
      setStatus('succeeded')
    } catch (e) {
      setStatus('failed')
      setError(e)
    }
  }

  const {
    query: { debug },
  } = useRouter()

  if (activeLink.claimable === null || activeLink.claimed === null || claims === null) {
    return <Box pad="medium">Loading collectable rewards...</Box>
  }

  const uncollected =
    activeLink.claimable !== null && activeLink.claimed !== null
      ? new BN(activeLink.claimable).sub(new BN(activeLink.claimed))
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
        {!new BN(activeLink.claimed).isZero() && (
          <>
            <>
              <br />
              <br />
              🏆 You have collected so far {toPrecision(baseToDisplay(activeLink.claimed, 18), 4)} RAD as rewards.
            </>
            {new BN(activeLink.claimed).gt(new BN(data?.totalEarnedRewards || '0')) && (
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
      </Box>
      <RewardStripe uncollected={uncollected || new BN(0)}>
        <Button
          margin={{ left: 'auto' }}
          label={status === 'unconfirmed' || status === 'pending' ? `Collecting...` : `Collect`}
          disabled={(!!uncollected && uncollected.isZero()) || status === 'unconfirmed' || status === 'pending'}
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
