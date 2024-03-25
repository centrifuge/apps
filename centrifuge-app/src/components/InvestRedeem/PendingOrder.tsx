import { Pool } from '@centrifuge/centrifuge-js'
import { Button, IconClock, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { formatBalance } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { ButtonGroup } from '../ButtonGroup'
import { AnchorTextLink } from '../TextLink'
import { EpochBusy } from './EpochBusy'
import { useInvestRedeem } from './InvestRedeemProvider'

export function PendingOrder({
  type,
  amount,
  pool,
  onCancelOrder,
  isCancelling,
  onChangeOrder,
}: {
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: Pool | TinlakePool
  onCancelOrder: () => void
  isCancelling: boolean
  onChangeOrder: () => void
}) {
  const { state } = useInvestRedeem()
  const calculatingOrders = pool.epoch.status !== 'ongoing'
  return (
    <Stack gap={2}>
      <EpochBusy busy={calculatingOrders} />
      <Stack gap={1}>
        <Shelf gap={1}>
          <IconClock size="iconSmall" />
          <Text variant="heading4">Open order</Text>
        </Shelf>
        <Stack
          p={2}
          gap={1}
          backgroundColor="secondarySelectedBackground"
          borderTopLeftRadius="input"
          borderTopRightRadius="input"
        >
          {type === 'invest' ? (
            <>
              <Text variant="body3">
                Invested {state.poolCurrency?.symbol} value{' '}
                <Text fontWeight={600}>{formatBalance(amount, state.poolCurrency?.symbol)}</Text>
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
                {state.poolCurrency?.symbol} value ~
                <Text fontWeight={600}>{formatBalance(amount.mul(state.tokenPrice), state.poolCurrency?.symbol)}</Text>
              </Text>
            </>
          )}
          <Text variant="body3">
            All orders are being collected and will be executed by the issuer of the pool.{' '}
            <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
          </Text>
        </Stack>
      </Stack>
      <ButtonGroup>
        {state.canChangeOrder && (
          <Button onClick={onChangeOrder} disabled={isCancelling || calculatingOrders}>
            Change order
          </Button>
        )}
        {state.canCancelOrder && (
          <Button onClick={onCancelOrder} loading={isCancelling} disabled={calculatingOrders} variant="secondary">
            Cancel
          </Button>
        )}
      </ButtonGroup>
    </Stack>
  )
}
