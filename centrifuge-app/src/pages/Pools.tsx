import { Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
import { PoolList } from '../components/PoolList'
import { PoolsTokensShared } from '../components/PoolsTokensShared'
import { useListedPools } from '../utils/useListedPools'

export function PoolsPage() {
  return (
    <LayoutBase>
      <PoolsTokensShared title="Pools">
        <Pools />
      </PoolsTokensShared>
    </LayoutBase>
  )
}

function Pools() {
  const [filtered, setFiltered] = React.useState(true)
  const [listedPools, , metadataIsLoading] = useListedPools()

  return listedPools?.length ? (
    <PoolList
      pools={filtered ? listedPools.filter(({ reserve }) => reserve.max.toFloat() > 0) : listedPools}
      isLoading={metadataIsLoading}
    />
  ) : (
    <Shelf p={4} justifyContent="center" textAlign="center">
      <Text variant="heading2" color="textSecondary">
        There are no pools yet
      </Text>
    </Shelf>
  )
}
