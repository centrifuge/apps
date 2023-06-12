import { Pool } from '@centrifuge/centrifuge-js'
import { Grid, IconClock, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { formatBalance } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useEpochTimeCountdown } from '../../utils/useEpochTimeCountdown'
import { Spinner } from '../Spinner'
import { AnchorTextLink } from '../TextLink'
import { EpochBusy } from './EpochBusy'
import { LightButton } from './LightButton'
import { TransactionsLink } from './TransactionsLink'

export const PendingOrder: React.FC<{
  type: 'invest' | 'redeem'
  amount: Decimal
  pool: Pool | TinlakePool
  onCancelOrder: () => void
  isCancelling: boolean
  onChangeOrder: () => void
}> = ({ type, amount, pool, onCancelOrder, isCancelling, onChangeOrder }) => {
  const { message: epochTimeRemaining } = useEpochTimeCountdown(pool.id!)
  const calculatingOrders = pool.epoch.status !== 'ongoing'
  return (
    <Stack gap={2}>
      <EpochBusy busy={calculatingOrders} />
      <Stack gap="1px">
        <Stack
          p={2}
          gap={1}
          backgroundColor="secondarySelectedBackground"
          borderTopLeftRadius="card"
          borderTopRightRadius="card"
        >
          <Shelf gap={1}>
            <IconClock size="iconSmall" />
            <Text variant="body2" fontWeight={500}>
              {formatBalance(amount, pool.currency.symbol)} locked
            </Text>
          </Shelf>
          <Text variant="body3">
            Locked {type === 'invest' ? 'investments' : 'redemptions'} are executed at the end of the epoch (
            {(pool.epoch.status === 'ongoing' && epochTimeRemaining) || `0 min remaining`}).{' '}
            <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
          </Text>
        </Stack>
        <Grid gap="1px" columns={2} equalColumns>
          <LightButton type="button" $left onClick={onCancelOrder} disabled={isCancelling || calculatingOrders}>
            {isCancelling ? (
              <Spinner size="iconSmall" />
            ) : (
              <Text variant="body2" color="inherit">
                Cancel
              </Text>
            )}
          </LightButton>
          <LightButton type="button" onClick={onChangeOrder} disabled={isCancelling || calculatingOrders}>
            <Text variant="body2" color="inherit">
              Change order
            </Text>
          </LightButton>
        </Grid>
      </Stack>
      <TransactionsLink />
    </Stack>
  )
}
