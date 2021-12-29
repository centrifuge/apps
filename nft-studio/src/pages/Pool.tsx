import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { usePool } from '../utils/usePools'

export const PoolPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pool />
    </PageWithSideBar>
  )
}

const Pool: React.FC = () => {
  const {
    params: { pid: poolId },
  } = useRouteMatch<{ pid: string }>()
  const { data: pool } = usePool(poolId)

  return (
    <Stack gap={8} flex={1}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Tranches
        </Text>
        {pool && (pool as any).tranches.map((tranche: any) => <>{tranche.name}</>)}
      </Stack>
    </Stack>
  )
}
