import { Pool } from '@centrifuge/centrifuge-js'
import { IconClock, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { formatBalance } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'

export function PendingOrder({
  type,
  amount,
  pool,
}: {
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: Pool | TinlakePool
}) {
  const { state } = useInvestRedeem()
  const calculatingOrders = pool.epoch.status !== 'ongoing'
  return (
    <Stack gap={2}>
      <EpochBusy busy={calculatingOrders} />
      <Stack gap={1}>
        <Stack
          p={2}
          gap={1}
          backgroundColor="secondarySelectedBackground"
          borderTopLeftRadius="input"
          borderTopRightRadius="input"
        >
          <Shelf gap={1}>
            <IconClock size="iconSmall" />
            <Text variant="heading4">Open order</Text>
          </Shelf>
          {type === 'invest' ? (
            <>
              <Text variant="body3">
                Invested {state.poolCurrency?.displayName} value{' '}
                <Text fontWeight={600}>{formatBalance(amount, state.poolCurrency?.displayName)}</Text>
              </Text>
              <Text variant="body3">
                Token amount ~
                <Text fontWeight={600}>
                  {formatBalance(amount.div(state.tokenPrice), state.trancheCurrency?.symbol)}
                </Text>
              </Text>
            </>
          ) : (
            <>
              <Text variant="body3">
                Token amount <Text fontWeight={600}>{formatBalance(amount, state.trancheCurrency?.symbol)}</Text>
              </Text>
              <Text variant="body3">
                {state.poolCurrency?.displayName} value ~
                <Text fontWeight={600}>
                  {formatBalance(amount.mul(state.tokenPrice), state.poolCurrency?.displayName)}
                </Text>
              </Text>
            </>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
