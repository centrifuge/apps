import { LayoutGrid, LayoutGridItem, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
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
  const { data: pools } = usePools()

  return (
    <Stack gap={8} flex={1}>
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          Pools
        </Text>
        {pools?.length ? (
          <>
            <LayoutGrid>
              {pools.map((pool) => (
                <LayoutGridItem span={4} key={pool.name}>
                  <Link to={`/pools/${pool.name}`}>{pool.name}</Link>
                </LayoutGridItem>
              ))}
            </LayoutGrid>
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
