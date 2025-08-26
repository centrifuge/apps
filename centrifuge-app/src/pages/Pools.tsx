import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Navigate } from 'react-router'
import { Dec } from '../../src/utils/Decimal'
import { formatBalance } from '../../src/utils/formatting'
import { useListedPools } from '../../src/utils/useListedPools'
import { useDebugFlags } from '../components/DebugFlags/context'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PoolList } from '../components/PoolList'
import { prefetchRoute } from '../components/Root'
import { config } from '../config'

export default function PoolsPage() {
  const { hideApp } = useDebugFlags()
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

  if (hideApp) {
    return <Navigate to="/migrate" />
  }

  return (
    <LayoutSection>
      <Stack>
        <Stack>
          <Text as="h3" variant="heading3">
            Pools of real-world assets
          </Text>
          <Box mt={40}>
            <Box display="flex">
              <Text color="#82888D" variant="body2" style={{ marginRight: 8 }}>
                Total value locked (TVL)
              </Text>
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
