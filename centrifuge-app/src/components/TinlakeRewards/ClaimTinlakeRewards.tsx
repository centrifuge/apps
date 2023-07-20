import { TransactionStatus, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { TinlakeTranche, useTinlakePortfolio } from '../../utils/tinlake/useTinlakePortfolio'
import { useRewardClaims, useTinlakeRewards, useUserRewards } from '../../utils/tinlake/useTinlakeRewards'
import { useAddress } from '../../utils/useAddress'
import { calculateCFGRewards, calcUnclaimed, createBufferProofFromClaim, createTree, newClaim } from './utils'

export function ClaimTinlakeRewards() {
  const { data } = useUserRewards()
  const { data: claims } = useRewardClaims()
  const { data: rewards } = useTinlakeRewards()
  const portfolio = useTinlakePortfolio()
  const address = useAddress()
  const balances = useBalances(address)

  const portfolioValue = portfolio.data?.totalValue
  const portfolioTinValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === TinlakeTranche.junior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))
  const portfolioDropValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === TinlakeTranche.senior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))
  const activeLink = data?.links.at(-1)

  const [status, setStatus] = React.useState<null | TransactionStatus>(null)
  const [error, setError] = React.useState<null | string>(null)

  const { execute } = useCentrifugeTransaction('Claim CFG rewards', (cent) => cent.tinlake.claimCFGRewards)

  const claim = async () => {
    setStatus('pending')
    setError(null)

    if (!claims) {
      throw new Error('claims must exist to claim')
    }

    const claim = claims?.find((c) => c.accountID === activeLink?.centAccountID)

    if (!claim) {
      throw new Error('claim must exist to claim')
    }

    const tree = createTree(claims.map((c) => newClaim(c)))
    const proof = createBufferProofFromClaim(tree, newClaim(claim))

    try {
      await execute([claim.accountID, claim.balance, proof])
      setStatus('succeeded')
    } catch (e) {
      console.log('error "ClaimTinlakeRewards" execute:', e)
      setStatus('failed')
      setError((e as Error).toString())
    }
  }

  if (!activeLink) {
    return null
  }

  if (activeLink?.claimable == null || activeLink?.claimed == null || claims == null) {
    return (
      <Box as={Card} p={2} pb={4}>
        <Text as="strong" variant="body3">
          Loading claimable rewards…
        </Text>
      </Box>
    )
  }

  const unclaimed = calcUnclaimed(activeLink)

  const dailyRewards =
    rewards?.dropRewardRate && rewards?.tinRewardRate && portfolioValue
      ? calculateCFGRewards(
          rewards.dropRewardRate
            ?.mul(portfolioDropValue?.toString() || 0)
            .add(rewards.tinRewardRate?.mul(portfolioTinValue?.toString() || 0))
            .toFixed(0) || '0'
        )
      : null

  return (
    <Stack as={Card} p={2} pb={4} gap={2}>
      {status === 'failed' && error && (
        <Text as="strong" variant="heading3" color="statusCritical">
          Error claiming rewards.
        </Text>
      )}

      {unclaimed && !unclaimed?.isZero() ? (
        <>
          <Shelf justifyContent="space-between">
            <Stack>
              <Text as="span" variant="body3">
                Claimable rewards
              </Text>
              <Text as="strong" variant="heading3">
                {calculateCFGRewards(unclaimed || '0')} CFG
              </Text>
            </Stack>

            <Button
              disabled={(!!unclaimed && unclaimed.isZero()) || status === 'unconfirmed' || status === 'pending'}
              onClick={claim}
              small
            >
              {status === 'unconfirmed' || status === 'pending' ? 'Claiming...' : 'Claim'}
            </Button>
          </Shelf>
        </>
      ) : (
        <>
          <Stack>
            <Text as="span" variant="body3">
              You claimed
            </Text>
            <Text as="strong" variant="heading3">
              {calculateCFGRewards((data?.links || []).reduce((p, l) => p.add(l.claimed || new BN(0)), new BN(0)))} CFG
            </Text>
          </Stack>

          {dailyRewards && (
            <Text as="span" variant="body3" color="textSecondary">
              Stay invested to continue earning {dailyRewards} {balances?.native.currency.symbol || 'CFG'} daily.
            </Text>
          )}
        </>
      )}
    </Stack>
  )
}
