import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { LoadBoundary } from './LoadBoundary'
import { MenuSwitch } from './MenuSwitch'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  return (
    <Stack gap={2}>
      <Stack>
        <Text as="h1" variant="heading1">
          {title}
        </Text>
        <Text as="p" variant="heading6">
          {`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
        </Text>
      </Stack>

      <LoadBoundary>
        <CardTotalValueLocked />
      </LoadBoundary>

      <Stack alignItems="end">
        <MenuSwitch />
      </Stack>

      {children}
    </Stack>
  )
}
