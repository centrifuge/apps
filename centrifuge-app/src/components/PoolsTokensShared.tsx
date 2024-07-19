import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { LayoutSection } from './LayoutBase/LayoutSection'
import { LoadBoundary } from './LoadBoundary'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export const PoolsTokensShared = ({ title, children }: PoolsTokensSharedProps) => (
  <LayoutSection py={5}>
    <Stack gap={4}>
      <Stack>
        <Text as="h1" variant="heading1">
          {title}
        </Text>
        <Text as="p" variant="heading4">
          {`Pools ${
            config.network === 'centrifuge' ? 'on Centrifuge let investors earn yield from real-world assets' : ''
          }`}
        </Text>
      </Stack>
      <LoadBoundary>
        <CardTotalValueLocked />
      </LoadBoundary>
      {children}
    </Stack>
  </LayoutSection>
)
