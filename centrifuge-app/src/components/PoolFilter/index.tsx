import { Grid, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { COLUMNS, COLUMN_GAPS } from '../PoolCard'
import { poolFilterConfig } from './config'
import { FilterMenu } from './FilterMenu'
import { SortButton } from './SortButton'

export function PoolFilter() {
  return (
    <Grid gridTemplateColumns={COLUMNS} gap={COLUMN_GAPS} alignItems="start">
      <Text>Pool name</Text>

      <FilterMenu {...poolFilterConfig.assetClass} />

      <SortButton {...poolFilterConfig.valueLocked} />

      <SortButton {...poolFilterConfig.apr} />

      <FilterMenu {...poolFilterConfig.poolStatus} />
    </Grid>
  )
}
