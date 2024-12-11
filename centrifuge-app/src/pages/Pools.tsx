import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Spinner } from '../../src/components/Spinner'
import { useTotalAssetsFinanced } from '../../src/utils/useListedPools'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { PoolList } from '../components/PoolList'
import { prefetchRoute } from '../components/Root'
import { config } from '../config'

export default function PoolsPage() {
  const { sumBorrowedAmount, isLoading } = useTotalAssetsFinanced()

  React.useEffect(() => {
    prefetchRoute('/pools/1')
    prefetchRoute('/pools/tokens')
  }, [])

  if (isLoading) return <Spinner />

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
                Total assets financed
              </Text>
            </Box>
            <Text as="h1" variant="heading1" style={{ fontSize: 36 }}>
              {sumBorrowedAmount} {config.baseCurrency}
            </Text>
          </Box>
        </Stack>
      </Stack>
      <PoolList />
    </LayoutSection>
  )
}
