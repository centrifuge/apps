import { Grid, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { poolFilterConfig } from './config'
import { FilterMenu } from './FilterMenu'
import { SortButton } from './SortButton'

export function PoolFilter() {
  return (
    <Grid gridTemplateColumns="repeat(5, minmax(0, 1fr))" alignItems="start">
      <Text>Pool name</Text>

      <FilterMenu {...poolFilterConfig.assetClass} />

      <SortButton {...poolFilterConfig.valueLocked} />

      <SortButton {...poolFilterConfig.apr} />

      <FilterMenu {...poolFilterConfig.poolStatus} />
    </Grid>
  )
}
