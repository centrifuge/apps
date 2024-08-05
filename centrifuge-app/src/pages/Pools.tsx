import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CardTotalValueLocked } from '../components/CardTotalValueLocked'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
import { LoadBoundary } from '../components/LoadBoundary'
import { PoolList } from '../components/PoolList'
import { prefetchRoute } from '../components/Root'
import { config } from '../config'

export default function PoolsPage() {
  React.useEffect(() => {
    prefetchRoute('/pools/1')
    prefetchRoute('/pools/tokens')
  }, [])
  return (
    <LayoutBase>
      <LayoutSection py={5}>
        <Stack gap={4}>
          <Stack>
            <Text as="h1" variant="heading1">
              Pools
            </Text>
            <Text as="p" variant="heading4">
              {`Pools ${
                config.network === 'centrifuge' ? 'on Centrifuge let investors earn yield from real-world assets' : ''
              }`}
            </Text>
          </Stack>
          <Box width="50%">
            <LoadBoundary>
              <CardTotalValueLocked />
            </LoadBoundary>
          </Box>
        </Stack>
        <PoolList />
      </LayoutSection>
    </LayoutBase>
  )
}
