import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { useBasePath } from '../utils/useBasePath'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { LayoutSection } from './LayoutBase/LayoutSection'
import { LoadBoundary } from './LoadBoundary'
import { MenuSwitch } from './MenuSwitch'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  const basePath = useBasePath()
  const isMedium = useIsAboveBreakpoint('M')

  const links = [
    {
      to: `${basePath}`,
      label: 'Pools',
    },
    {
      to: `${basePath}/tokens`,
      label: 'Tokens',
    },
  ]

  return (
    <LayoutSection py={5}>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          <Text as="p" variant="heading4">
            {`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
          </Text>
        </Stack>

        <LoadBoundary>
          <CardTotalValueLocked />
        </LoadBoundary>

        {isMedium && (
          <Stack alignItems="end">
            <MenuSwitch links={links} />
          </Stack>
        )}
        {children}
      </Stack>
    </LayoutSection>
  )
}
