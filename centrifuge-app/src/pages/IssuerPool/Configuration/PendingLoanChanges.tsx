import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useLoanChanges, usePoolOrders } from '../../../utils/usePools'

const POOL_CHANGE_DELAY = 1000 * 60 * 60 * 24 * 7 // Currently hard-coded to 1 week on chain, will probably change to a constant we can query

// Currently only showing write-off policy changes
export function PendingLoanChanges({ poolId }: { poolId: string }) {
  const poolOrders = usePoolOrders(poolId)
  const hasLockedRedemptions = (poolOrders?.reduce((acc, cur) => acc + cur.activeRedeem.toFloat(), 0) ?? 0) > 0
  const loanChanges = useLoanChanges(poolId)
  const policyChanges = loanChanges?.filter(({ change }) => !!change.loan?.policy?.length)

  const {
    execute: executeApply,
    isLoading: isApplyLoading,
    lastCreatedTransaction,
  } = useCentrifugeTransaction('Apply write-off policy', (cent) => cent.pools.applyWriteOffPolicyUpdate)

  return (
    <Stack gap={1}>
      {policyChanges?.map((policy) => {
        const waitingPeriodDone = new Date(policy.submittedAt).getTime() + POOL_CHANGE_DELAY < Date.now()

        return (
          <Shelf gap={2}>
            <Text>Pending policy update</Text>
            <Text>
              {!waitingPeriodDone
                ? 'In waiting period'
                : hasLockedRedemptions
                ? 'Blocked by locked redemptions'
                : 'Can be applied'}
            </Text>
            <Button
              variant="secondary"
              small
              onClick={() => executeApply([poolId, policy.hash])}
              loading={isApplyLoading && lastCreatedTransaction?.args[1] === policy.hash}
              style={{ marginLeft: 'auto' }}
            >
              Apply
            </Button>
          </Shelf>
        )
      })}
    </Stack>
  )
}
