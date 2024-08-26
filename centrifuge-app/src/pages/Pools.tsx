import { formatBalance } from '@centrifuge/centrifuge-react'
import { Box, IconArrowUpRight, Stack, StatusChip, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useListedPools } from '../../src/utils/useListedPools'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PoolList } from '../components/PoolList'
import { prefetchRoute } from '../components/Root'
import { config } from '../config'
import { Dec } from '../utils/Decimal'

export default function PoolsPage() {
  const [, listedTokens] = useListedPools()

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
    <LayoutSection py={5}>
      <Stack gap={4} mb={20}>
        <Stack>
          <Text as="h3" variant="heading3" color="textBlack">
            Pools of real-world assets
          </Text>
          <Box mt={40}>
            <Box display="flex">
              <Text color="textDisabled" variant="body2" style={{ marginRight: 8 }}>
                Total value locked (TVL)
              </Text>
              <StatusChip status="ok">
                <IconArrowUpRight size={16} color="ok" />
                <Text variant="body3" color="ok">
                  24% YoY
                </Text>
              </StatusChip>
            </Box>
            <Text as="h1" variant="heading1" color="textBlack" style={{ fontSize: 36 }}>
              {formatBalance(totalValueLocked ?? 0, config.baseCurrency)}
            </Text>
          </Box>
        </Stack>
      </Stack>
      <PoolList />
    </LayoutSection>
  )
}
