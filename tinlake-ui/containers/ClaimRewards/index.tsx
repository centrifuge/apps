import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button } from 'grommet'
import * as React from 'react'
import Alert from '../../components/Alert'
import { Tooltip } from '../../components/Tooltip'
import { TransactionStatus } from '../../ducks/transactions'
import { centChainService } from '../../services/centChain'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { createBufferProofFromClaim, createTree, newClaim } from '../../utils/cfgRewardProofs'
import { toDynamicPrecision } from '../../utils/toDynamicPrecision'
import { useGlobalRewards } from '../../utils/useGlobalRewards'
import { useRewardClaims, UserRewardsLink, useUserRewards } from '../../utils/useUserRewards'
import { RewardStripe, Small } from './styles'

interface Props {
  activeLink: UserRewardsLink
  portfolioValue: BN | undefined
  portfolioTinValue: BN | undefined
  portfolioDropValue: BN | undefined
}

const ClaimRewards: React.FC<Props> = ({ activeLink, portfolioValue, portfolioDropValue, portfolioTinValue }) => {
  const { data, refetchCentChain } = useUserRewards()
  const { data: claims } = useRewardClaims()
  const rewards = useGlobalRewards()

  const [claimExtHash, setClaimExtHash] = React.useState<null | string>(null)
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
      const hash = await centChainService().claimCFGRewards(claim.accountID, claim.balance, proof)
      setClaimExtHash(hash)
      await refetchCentChain()
      setStatus('succeeded')
    } catch (e) {
      setStatus('failed')
      setError((e as Error).toString())
    }
  }

  if (activeLink.claimable == null || activeLink.claimed == null || claims == null) {
    return <Box pad="medium">Loading claimable rewards...</Box>
  }

  const unclaimed = calcUnclaimed(activeLink)

  return (
    <>
      <Box pad={{ horizontal: 'medium', bottom: 'medium' }}>
        {unclaimed && !unclaimed?.isZero() ? (
          (status === null || status === 'unconfirmed' || status === 'failed' || status === 'pending') && (
            <>
              🎉 You can claim {addThousandsSeparators(toDynamicPrecision(baseToDisplay(unclaimed, 18)))} CFG rewards.
              Claim now to stake CFG and participate in on-chain governance.
              {/* TODO re-enable once subscan has fixed the issue that unsigned extrinsics are not linkable */}
              {claimExtHash && false && (
                <>
                  <br />
                  <br />
                  <Anchor href={`https://centrifuge.subscan.io/extrinsic/${claimExtHash}`} target="_blank">
                    View claim transaction on Subscan
                  </Anchor>
                </>
              )}
              {unclaimed.gt(data?.totalEarnedRewards || new BN(0)) && (
                <>
                  <br />
                  <br />
                  <Tooltip
                    title="Your unclaimed rewards are higher than the rewards on the connected Ethereum account. Learn why..."
                    description={`Your unclaimed rewards on this Centrifuge Chain account can be higher than the rewards you earned on the connected
                      Ethereum account if you have set this Centrifuge Chain account as recipient for multiple
                      Ethereum accounts.`}
                    underline
                  >
                    <Small>
                      Your unclaimed rewards are higher than the rewards on the connected Ethereum account. Learn why...
                    </Small>
                  </Tooltip>
                </>
              )}
            </>
          )
        ) : (
          <>
            🏆 You have claimed{' '}
            {addThousandsSeparators(
              toDynamicPrecision(
                baseToDisplay(
                  (data?.links || []).reduce((p, l) => p.add(l.claimed || new BN(0)), new BN(0)),
                  18
                )
              )
            )}{' '}
            CFG in rewards.{' '}
            {/* TODO re-enable once subscan has fixed the issue that unsigned extrinsics are not linkable */}
            {status === 'succeeded' && claimExtHash && false && (
              <>
                <br />
                <br />
                <Anchor href={`https://centrifuge.subscan.io/extrinsic/${claimExtHash}`} target="_blank">
                  View claim transaction on Subscan
                </Anchor>
                <br />
              </>
            )}
            Stay invested to continue earning{' '}
            {rewards.data?.dropRewardRate &&
              rewards.data?.tinRewardRate &&
              portfolioValue &&
              addThousandsSeparators(
                toDynamicPrecision(
                  baseToDisplay(
                    rewards.data?.dropRewardRate
                      ?.mul(portfolioDropValue?.toString() || 0)
                      .add(rewards.data?.tinRewardRate?.mul(portfolioTinValue?.toString() || 0))
                      .toFixed(0) || '0',
                    18
                  )
                )
              )}{' '}
            CFG daily.
            {activeLink.claimed.gt(data?.totalEarnedRewards || new BN(0)) && (
              <>
                <br />
                <br />
                <Tooltip
                  title="Your claimed rewards are higher than the rewards on the connected Ethereum account. Learn why..."
                  description={`Your claimed rewards on this Centrifuge Chain account can be higher than the rewards you earned on the connected Ethereum
                      account if you have set this Centrifuge Chain account as recipient for multiple Ethereum
                      accounts.`}
                  underline
                >
                  <Small>
                    Your claimed rewards are higher than the rewards on the connected Ethereum account. Learn why...
                  </Small>
                </Tooltip>
              </>
            )}
          </>
        )}
        {status === 'failed' && error && (
          <Alert type="error" style={{ marginTop: 24 }}>
            Error claiming rewards. {error}
          </Alert>
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

function calcUnclaimed(link: UserRewardsLink): null | BN {
  if (!link.claimable || !link.claimed) {
    return null
  }
  const unclaimed = link.claimable.sub(link.claimed)
  if (unclaimed.ltn(0)) {
    return new BN(0)
  }
  return unclaimed
}
