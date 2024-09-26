import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
import { LayoutSection } from '../components/LayoutBase/LayoutSection'
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
        <Stack mb={2}>
          <Text as="h1" variant="heading1">
            Pools
          </Text>
          <Text as="p" variant="heading4">
            {`Pools ${
              config.network === 'centrifuge' ? 'on Centrifuge let investors earn yield from real-world assets' : ''
            }`}
          </Text>
        </Stack>
        <PoolList />
      </LayoutSection>
    </LayoutBase>
  )
}
