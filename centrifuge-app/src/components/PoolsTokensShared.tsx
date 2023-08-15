import { Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { BaseSection } from './LayoutBase/BaseSection'
import { LoadBoundary } from './LoadBoundary'
import { MenuSwitch } from './MenuSwitch'
import { PortfolioCta } from './PortfolioCta'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  return (
    <BaseSection pt={3} pb={4}>
      <Stack gap={4}>
        <Stack>
          <Text as="h1" variant="heading1">
            {title}
          </Text>
          <Text as="p" variant="heading6">
            {`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
          </Text>
        </Stack>

        <Grid gridTemplateColumns={['1fr', '1fr', '1fr', 'repeat(2, minmax(0, 1fr))']} gap={[2, 2, 2, 4]}>
          <LoadBoundary>
            <CardTotalValueLocked />
          </LoadBoundary>
          <PortfolioCta />
        </Grid>

        <Stack alignItems="end">
          <MenuSwitch />
        </Stack>

        {children}
      </Stack>
    </BaseSection>
  )
}
