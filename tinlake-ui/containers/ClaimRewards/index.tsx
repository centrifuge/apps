import { Tooltip } from '@centrifuge/axis-tooltip'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import Alert from '../../components/Alert'
import { RewardsState } from '../../ducks/rewards'
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
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
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

  if (activeLink.claimable === null || activeLink.claimed === null || claims === null) {
    return <Box pad="medium">Loading claimable rewards...</Box>
  }

  const unclaimed =
    activeLink.claimable !== null && activeLink.claimed !== null ? activeLink.claimable.sub(activeLink.claimed) : null

  return (
    <>
      <Box pad={{ horizontal: 'medium', bottom: 'medium' }}>
        {unclaimed && !unclaimed?.isZero() ? (
          <>
            {(status === null || status === 'unconfirmed' || status === 'failed' || status === 'pending') && (
              <>
                🎉 You can claim {toDynamicPrecision(baseToDisplay(unclaimed, 18))} unclaimed RAD rewards. Claim now to
                stake value and participate in on-chain governance.
                {unclaimed!.gt(data?.totalEarnedRewards || new BN(0)) && (
                  <>
                    <br />
                    <br />
                    <Tooltip
                      title="Your unclaimed rewards are higher than the rewards on the connected Ethereum account. Learn why..."
                      description={`Your unclaimed rewards on this Centrifuge Chain account can be higher than the rewards you earned on the connected
                      Ethereum account if you have set this Centrifuge Chain account as recipient for multiple
                      Ethereum accounts.`}
                    >
                      <Small>
                        Your unclaimed rewards are higher than the rewards on the connected Ethereum account. Learn
                        why...
                      </Small>
                    </Tooltip>
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
            🏆 You have claimed all your{' '}
            {toDynamicPrecision(
              baseToDisplay(
                (data?.links || []).reduce((p, l) => p.add(l.claimed || new BN(0)), new BN(0)),
                18
              )
            )}{' '}
            RAD rewards. Stay invested to continue earning{' '}
            {rewards.data?.rewardRate &&
              data?.currentActiveInvestmentAmount &&
              toDynamicPrecision(
                baseToDisplay(
                  rewards.data?.rewardRate.mul(data?.currentActiveInvestmentAmount.toString()).toFixed(0),
                  18
                )
              )}{' '}
            RAD daily.
            {activeLink.claimed.gt(data?.totalEarnedRewards || new BN(0)) && (
              <>
                <br />
                <br />
                <Tooltip
                  title="Your claimed rewards are higher than the rewards on the connected Ethereum account. Learn why..."
                  description={`Your claimed rewards on this Centrifuge Chain account can be higher than the rewards you earned on the connected Ethereum
                      account if you have set this Centrifuge Chain account as recipient for multiple Ethereum
                      accounts.`}
                >
                  <Small>
                    Your claimed rewards are higher than the rewards on the connected Ethereum account. Learn why...
                  </Small>
                </Tooltip>
              </>
            )}
          </>
        )}
      </Box>
      <RewardStripe unclaimed={unclaimed}>
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

const RewardStripe = ({ unclaimed, children }: React.PropsWithChildren<{ unclaimed: BN | null }>) => (
  <Cont direction="row" pad={{ vertical: 'small', horizontal: 'medium' }}>
    <TokenLogo src="/static/rad-black.svg" />
    <Box>
      <Label>Your unclaimed rewards</Label>
      <Number>{toDynamicPrecision(baseToDisplay(unclaimed || '0', 18))} RAD</Number>
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

const Small = styled.small`
  font-size: 11px;
`
