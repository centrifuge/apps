import { useAddress, useBalances } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useTinlakePools } from '../../utils/tinlake/useTinlakePools'
import { usePools } from '../../utils/usePools'
import { SortButton } from '../SortButton'
import { sortTokens } from './sortTokens'
import { TokenListItem } from './TokenListItem'

export const COLUMN_GAPS = '250px 180px 150px 180px'

export const InvestedTokens = ({ canInvestRedeem = true }) => {
  const { search } = useLocation()

  const address = useAddress()
  const centBalances = useBalances(address)
  const { data: tinlakeBalances } = useTinlakeBalances()

  const { data: tinlakePools } = useTinlakePools()
  const pools = usePools()

  const balances = useMemo(() => {
    return [
      ...(centBalances?.tranches || []),
      ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []),
    ]
  }, [centBalances, tinlakeBalances])

  const sortedTokens =
    balances.length && pools && tinlakePools
      ? sortTokens(
          balances,
          {
            centPools: pools,
            tinlakePools: tinlakePools.pools,
          },
          new URLSearchParams(search)
        )
      : []

  return sortedTokens.length ? (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Portfolio
      </Text>

      <Box overflow="auto">
        <Grid gridTemplateColumns={COLUMN_GAPS} gap={3} alignItems="start" px={2}>
          <Text as="span" variant="body3">
            Token
          </Text>

          <SortButton label="Position" searchKey="position" justifySelf="start" />

          <Text as="span" variant="body3">
            Token price
          </Text>

          <SortButton label="Market Value" searchKey="market-value" justifySelf="start" />
        </Grid>

        <Stack as="ul" role="list" gap={1} py={1}>
          {balances.map((balance, index) => (
            <TokenListItem key={index} canInvestRedeem={canInvestRedeem} {...balance} />
          ))}
        </Stack>
      </Box>
    </Stack>
  ) : null
}
