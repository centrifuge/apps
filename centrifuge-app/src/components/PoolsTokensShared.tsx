import { Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { config } from '../config'
import { CardTotalValueLocked } from './CardTotalValueLocked'
import { LayoutSection } from './LayoutBase/LayoutSection'
import { LoadBoundary } from './LoadBoundary'
import { MenuSwitch } from './MenuSwitch'
import { PortfolioCta } from './PortfolioCta'

type PoolsTokensSharedProps = {
  title: string
  children: React.ReactNode
}

export function PoolsTokensShared({ title, children }: PoolsTokensSharedProps) {
  const basePath = useRouteMatch(['/pools', '/issuer'])?.path || ''
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
    <LayoutSection pt={5}>
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
          <LoadBoundary>
            <PortfolioCta />
          </LoadBoundary>
        </Grid>

        <Stack alignItems="end">
          <MenuSwitch links={links} />
        </Stack>
        {children}
      </Stack>
    </LayoutSection>
  )
}
