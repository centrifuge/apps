import { useAddress, useBalances } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import { useMemo, useState } from 'react'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useTinlakePools } from '../../utils/tinlake/useTinlakePools'
import { usePools } from '../../utils/usePools'
import { FilterButton } from '../FilterButton'
import { SortChevrons } from '../SortChevrons'
import { sortTokens } from './sortTokens'
import { TokenListItem } from './TokenListItem'

export const COLUMN_GAPS = '200px 140px 140px 140px'

export type SortOptions = {
  sortBy: 'position' | 'market-value'
  sortDirection: 'asc' | 'desc'
}

// TODO: change canInvestRedeem to default to true once the drawer is implemented
export const InvestedTokens = ({ canInvestRedeem = false }) => {
  const [sortOptions, setSortOptions] = useState<SortOptions>({ sortBy: 'position', sortDirection: 'desc' })

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
          sortOptions
        )
      : []

  const handleSort = (sortOption: SortOptions['sortBy']) => {
    setSortOptions((prev) => ({
      sortBy: sortOption,
      sortDirection: prev.sortBy !== sortOption ? 'desc' : prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }))
  }

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

          <FilterButton forwardedAs="span" variant="body3" onClick={() => handleSort('position')}>
            Position
            <SortChevrons
              sorting={{ isActive: sortOptions.sortBy === 'position', direction: sortOptions.sortDirection }}
            />
          </FilterButton>

          <Text as="span" variant="body3">
            Token price
          </Text>

          <FilterButton forwardedAs="span" variant="body3" onClick={() => handleSort('market-value')}>
            Market Value
            <SortChevrons
              sorting={{ isActive: sortOptions.sortBy === 'market-value', direction: sortOptions.sortDirection }}
            />
          </FilterButton>
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
