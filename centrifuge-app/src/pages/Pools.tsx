import { formatBalance } from '@centrifuge/centrifuge-react'
import { Box, IconArrowDown, IconArrowUpRight, Stack, StatusChip, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useListedPools, useYearOverYearGrowth } from '../../src/utils/useListedPools'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PoolList } from '../components/PoolList'
import { prefetchRoute } from '../components/Root'
import { config } from '../config'
import { Dec } from '../utils/Decimal'

export default function PoolsPage() {
  const [, listedTokens] = useListedPools()
  const { totalYoyGrowth, isLoading } = useYearOverYearGrowth()
  const isPositiveYoy = totalYoyGrowth > 0
  const IconComponent = isPositiveYoy ? IconArrowUpRight : IconArrowDown

  const totalValueLocked = React.useMemo(() => {
    return (
      listedTokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [listedTokens])

  React.useEffect(() => {
    prefetchRoute('/pools/1')
    prefetchRoute('/pools/tokens')
  }, [])

  return (
    <LayoutSection>
      <Stack>
        <Stack>
          <Text as="h3" variant="heading3">
            Pools of real-world assets
          </Text>
          <Box mt={40}>
            <Box display="flex">
              <Text color="textDisabled" variant="body2" style={{ marginRight: 8 }}>
                Total value locked (TVL)
              </Text>
              {!isLoading && (
                <StatusChip status={isPositiveYoy ? 'ok' : 'critical'}>
                  <Box display="flex" alignItems="center" pt="2px">
                    <IconComponent size={16} color="ok" />
                    <Text variant="body3" color={isPositiveYoy ? 'ok' : 'warning'}>
                      {formatBalance(totalYoyGrowth ?? 0, '', 2)} YoY
                    </Text>
                  </Box>
                </StatusChip>
              )}
            </Box>
            <Text as="h1" variant="heading1" style={{ fontSize: 36 }}>
              {formatBalance(totalValueLocked ?? 0, config.baseCurrency)}
            </Text>
          </Box>
        </Stack>
      </Stack>
      <PoolList />
    </LayoutSection>
  )
}
