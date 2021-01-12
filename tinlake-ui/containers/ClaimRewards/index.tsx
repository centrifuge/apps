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
import { toDynamicPrecision } from '../../utils/toDynamicPrecision'

interface Props {
  activeLink: UserRewardsLink
}

const ClaimRewards: React.FC<Props> = ({ activeLink }: Props) => {
  const { data, claims } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const [status, setStatus] = React.useState<null | TransactionStatus>(null)
  const [error, setError] = React.useState<null | string>(null)
  const claim = async () => {
    setStatus('pending')
    setError(null)

    if (!claims) {
      throw new Error('claims must exist to claim')
    }

    const claim = claims?.find((c) => c.accountID === activeLink.centAccountID)

    if (!claim) {
      throw new Error('claim must exist to claim')
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
    return <Box pad="medium">Loading claimable rewards...</Box>
  }

  const unclaimed =
    activeLink.claimable !== null && activeLink.claimed !== null
      ? new BN(activeLink.claimable).sub(new BN(activeLink.claimed))
      : null

  return (
    <>
      <Box pad="medium">
        {unclaimed && !unclaimed?.isZero() ? (
          <>
            {(status === null || status === 'unconfirmed' || status === 'failed' || status === 'pending') && (
              <>
                🎉 You have {toDynamicPrecision(baseToDisplay(unclaimed, 18))} unclaimed RAD rewards.
                {unclaimed.gt(new BN(data?.totalEarnedRewards || '0')) && (
                  <>
                    <br />
                    <br />
                    Your unclaimed rewards on this address can be higher than the rewards you earned on the connected
                    Ethereum address, e. g. if you have set this Centrifuge Chain address as recipient for multiple
                    Ethereum addresses.
                  </>
                )}
              </>
            )}
            {status === 'succeeded' && (
              <Alert type="success" style={{ marginTop: 24 }}>
                You have claimed {toDynamicPrecision(baseToDisplay(unclaimed, 18))} RAD. If you still have active
                investments, please come back tomorrow or at a later time to claim more rewards.
              </Alert>
            )}
            {status === 'failed' && error && (
              <Alert type="error" style={{ marginTop: 24 }}>
                Error claiming rewards. {error}
              </Alert>
            )}
          </>
        ) : (
          <>
            👍 You have claimed all your rewards. If you still have active investments, please come back tomorrow or at
            a later time to claim more rewards.
          </>
        )}
        {!new BN(activeLink.claimed).isZero() && (
          <>
            <>
              <br />
              <br />
              🏆 You have claimed so far{' '}
              {toDynamicPrecision(
                baseToDisplay(
                  (data?.links || []).reduce((p, l) => p.add(new BN(l.claimed || '0')), new BN(0)),
                  18
                )
              )}{' '}
              RAD as rewards.
            </>
            {new BN(activeLink.claimed).gt(new BN(data?.totalEarnedRewards || '0')) && (
              <>
                <br />
                <br />
                Your claimed rewards on this address can be higher than the rewards you earned on the connected Ethereum
                address, e. g. if you have set this Centrifuge Chain address as recipient for multiple Ethereum
                addresses.
              </>
            )}
          </>
        )}
      </Box>
      <RewardStripe unclaimed={unclaimed || new BN(0)}>
        <Button
          margin={{ left: 'auto' }}
          label={status === 'unconfirmed' || status === 'pending' ? `Claiming...` : `Claim`}
          disabled={(!!unclaimed && unclaimed.isZero()) || status === 'unconfirmed' || status === 'pending'}
          onClick={claim}
        />
      </RewardStripe>
    </>
  )
}

export default ClaimRewards

const RewardStripe = ({ unclaimed, children }: React.PropsWithChildren<{ unclaimed: BN }>) => (
  <Cont direction="row" pad={{ vertical: 'small', horizontal: 'medium' }}>
    <TokenLogo src="/static/rad-black.svg" />
    <Box>
      <Label>Your unclaimed rewards</Label>
      <Number>{toDynamicPrecision(baseToDisplay(unclaimed, 18))} RAD</Number>
    </Box>
    {children}
  </Cont>
)

const Cont = styled(Box)`
  background: #fcba59;
  border-radius: 0 0 6px 6px;
`

const TokenLogo = styled.img`
  margin: 0 14px 0 0;
  width: 24px;
  height: 24px;
  position: relative;
  top: 12px;
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
