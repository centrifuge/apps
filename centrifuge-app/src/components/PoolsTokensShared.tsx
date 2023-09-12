import { Grid, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../config'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { LayoutMain } from './LayoutBase'
import { LoadBoundary } from './LoadBoundary'
import { MenuSwitch } from './MenuSwitch'
import { PortfolioCta } from './PortfolioCta'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  return (
    <LayoutMain
      title={title}
      subtitle={`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
    >
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
    </LayoutMain>
  )
}
