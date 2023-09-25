import { AccountTokenBalance, Pool } from '@centrifuge/centrifuge-js'
import { formatBalance, useBalances } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'
import { usePool } from '../../utils/usePools'

const TOKEN_ITEM_COLUMNS = `250px 200px 100px 150px 1FR`
const TOKEN_ITEM_GAP = 4

export function InvestedTokens() {
  const address = useAddress()
  const balances = useBalances(address)

  return !!balances?.tranches && !!balances?.tranches.length ? (
    <>
      <Box as="article">
        <Text as="h2" variant="heading2">
          Portfolio Composition
        </Text>
      </Box>
      <Stack gap={1}>
        <Grid gridTemplateColumns={TOKEN_ITEM_COLUMNS} gap={TOKEN_ITEM_GAP} px={2}>
          <Text as="span" variant="body3">
            Token
          </Text>
          <Text as="button" variant="body3">
            Position
          </Text>
          <Text as="span" variant="body3">
            Token price
          </Text>
          <Text as="button" variant="body3">
            Market value
          </Text>
        </Grid>

        <Stack as="ul" role="list" gap={1}>
          {balances.tranches.map((tranche, index) => (
            <Box key={`${tranche.trancheId}${index}`} as="li">
              <TokenListItem {...tranche} />
            </Box>
          ))}
        </Stack>
      </Stack>
    </>
  ) : null
}

type TokenCardProps = AccountTokenBalance
export function TokenListItem({ balance, currency, poolId, trancheId }: TokenCardProps) {
  const pool = usePool(poolId) as Pool
  const isTinlakePool = poolId?.startsWith('0x')

  if (isTinlakePool) {
    return null
  }

  const tranche = pool.tranches.find(({ id }) => id === trancheId)

  return (
    <Grid
      gridTemplateColumns={TOKEN_ITEM_COLUMNS}
      gap={TOKEN_ITEM_GAP}
      padding={2}
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderSecondary"
    >
      <Text as="span" variant="body2">
        {currency.name}
      </Text>

      <Text as="span" variant="body2">
        {formatBalance(balance, tranche?.currency.symbol)}
      </Text>

      <Text as="span" variant="body2">
        {tranche?.tokenPrice ? formatBalance(tranche.tokenPrice.toDecimal(), tranche.currency.symbol, 4) : '-'}
      </Text>

      <Text as="span" variant="body2">
        {tranche?.tokenPrice
          ? formatBalance(balance.toDecimal().mul(tranche.tokenPrice.toDecimal()), tranche.currency.symbol, 4)
          : '-'}
      </Text>
    </Grid>
  )
}
