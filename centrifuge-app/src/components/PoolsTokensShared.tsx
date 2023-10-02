import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { BasePadding } from './LayoutBase/BasePadding'
import { MenuSwitch } from './MenuSwitch'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  return (
    <BasePadding>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          <Text as="p" variant="heading6">
            {`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
          </Text>
        </Stack>
        <Stack alignItems="end">
          <MenuSwitch />
        </Stack>
        {children}
      </Stack>
    </BasePadding>
  )
}
