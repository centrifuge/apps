import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { DataTableCol, DataTableRow } from '../components/DataTable'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { usePools } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const centrifuge = useCentrifuge()
  const { data: pools } = usePools()

  return (
    <Stack gap={8} flex={1}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Pools
        </Text>
        {pools?.length ? (
          <>
            {pools.map((pool) => (
              <DataTableRow key={pool.name}>
                <DataTableCol>
                  <Link to={`/pools/${pool.name}`}>{pool.name}</Link>
                </DataTableCol>
                <DataTableCol>{centrifuge.utils.formatCurrencyAmount(pool.totalReserve)}</DataTableCol>
              </DataTableRow>
            ))}
          </>
        ) : (
          <Shelf justifyContent="center" textAlign="center">
            <Text variant="heading2" color="textSecondary">
              There are no pools yet
            </Text>
          </Shelf>
        )}
      </Stack>
    </Stack>
  )
}
