import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeConsts, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { formatBalance } from '../../utils/formatting'
import { TinlakeTranche, useTinlakePortfolio } from '../../utils/tinlake/useTinlakePortfolio'
import { useRewardClaims, useTinlakeRewards, useUserRewards } from '../../utils/tinlake/useTinlakeRewards'
import { useAddress } from '../../utils/useAddress'
import { calcUnclaimed, createBufferProofFromClaim, createTree, newClaim } from './utils'

export function ClaimTinlakeRewards() {
  const { data } = useUserRewards()
  const consts = useCentrifugeConsts()
  const { data: claims } = useRewardClaims()
  const { data: rewards } = useTinlakeRewards()
  const portfolio = useTinlakePortfolio()
  const centAddress = useAddress('substrate')

  const portfolioValue = portfolio.data?.totalValue
  const portfolioTinValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === TinlakeTranche.junior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))
  const portfolioDropValue = portfolio.data?.tokenBalances
    ?.filter((tb) => tb.tranche === TinlakeTranche.senior)
    .reduce((sum, tb) => tb.value.add(sum), new BN(0))
  const activeLink = data?.links.at(-1)

  const { execute, lastCreatedTransaction } = useCentrifugeTransaction(
    'Claim CFG rewards',
    (cent) => cent.tinlake.claimCFGRewards
  )

  function claim() {
    if (!claims) {
      throw new Error('claims must exist to claim')
    }

    const claim = claims?.find((c) => c.accountID === activeLink?.centAccountID)

    if (!claim) {
      throw new Error('claim must exist to claim')
    }

    const tree = createTree(claims.map((c) => newClaim(c)))
    const proof = createBufferProofFromClaim(tree, newClaim(claim))

    execute([claim.accountID, claim.balance, proof])
  }

  if (!activeLink) {
    return null
  }

  if (activeLink?.claimable == null || activeLink?.claimed == null || claims == null) {
    return null
  }

  const unclaimed = calcUnclaimed(activeLink)

  const dailyRewards =
    rewards?.dropRewardRate && rewards?.tinRewardRate && portfolioValue
      ? formatBalance(
          new CurrencyBalance(
            rewards.dropRewardRate
              ?.mul(portfolioDropValue?.toString() || 0)
              .add(rewards.tinRewardRate?.mul(portfolioTinValue?.toString() || 0))
              .toFixed(0) || '0',
            18
          )
        )
      : null

  const status = lastCreatedTransaction?.status
  return (
    <Stack as={Card} p={2} pb={2} gap={2}>
      {status === 'failed' && (
        <Text as="strong" variant="heading3" color="statusCritical">
          Error claiming rewards.
        </Text>
      )}

      {unclaimed && !unclaimed?.isZero() ? (
        <Stack gap={1}>
          {!centAddress && <Text variant="body2">Connect Polkadot wallet to claim</Text>}
          <Shelf justifyContent="space-between">
            <Stack>
              <Text as="span" variant="body3">
                Claimable rewards
              </Text>
              <Text as="strong" variant="heading3">
                {formatBalance(unclaimed || '0')} CFG
              </Text>
            </Stack>

            <Button
              disabled={!!unclaimed && unclaimed.isZero()}
              loading={status === 'unconfirmed' || status === 'pending'}
              onClick={claim}
              small
            >
              {status === 'unconfirmed' || status === 'pending'
                ? 'Claiming...'
                : centAddress
                ? 'Claim'
                : 'Connect & Claim'}
            </Button>
          </Shelf>
        </Stack>
      ) : (
        <>
          <Stack>
            <Text as="span" variant="body3">
              You claimed
            </Text>
            <Text as="strong" variant="heading3">
              {formatBalance(
                new CurrencyBalance(
                  (data?.links || []).reduce((p, l) => p.add(l.claimed || new BN(0)), new BN(0)),
                  18
                )
              )}{' '}
              {consts.chainSymbol || 'CFG'}
            </Text>
          </Stack>

          {dailyRewards && (
            <Text as="span" variant="body3" color="textSecondary">
              Stay invested to continue earning {dailyRewards} {consts.chainSymbol || 'CFG'} daily.
            </Text>
          )}
        </>
      )}
    </Stack>
  )
}
