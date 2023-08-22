import { AccountTokenBalance, Pool } from '@centrifuge/centrifuge-js'
import { Grid, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../utils/formatting'
import { usePool } from '../utils/usePools'

type TokenCardProps = AccountTokenBalance

export const TOKEN_CARD_COLUMNS = `250px 200px 100px 150px 1FR`
export const TOKEN_CARD_GAP = 4

export function TokenCard({ balance, currency, poolId, trancheId }: TokenCardProps) {
  const pool = usePool(poolId) as Pool
  const isTinlakePool = poolId?.startsWith('0x')

  if (isTinlakePool) {
    return null
  }

  const tranche = pool.tranches.find(({ id }) => id === trancheId)

  return (
    <Grid
      gridTemplateColumns={TOKEN_CARD_COLUMNS}
      gap={TOKEN_CARD_GAP}
      padding={2}
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderSecondary"
    >
      <Text as="span" variant="body2">
        {currency.name}
      </Text>

      <Text as="span" variant="body2">
        {formatBalance(balance, currency)}
      </Text>

      <Text as="span" variant="body2">
        {tranche?.tokenPrice ? formatBalance(tranche.tokenPrice, tranche.poolCurrency, 4, 2) : '-'}
      </Text>

      <Text as="span" variant="body2">
        {tranche?.tokenPrice
          ? formatBalance(balance.toDecimal().mul(tranche.tokenPrice.toDecimal()), tranche.poolCurrency, 4, 2)
          : '-'}
      </Text>
    </Grid>
  )
}
