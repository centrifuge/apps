import { Grid, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { COLUMNS, COLUMN_GAPS, PoolCardProps } from '../PoolCard'
import { poolFilterConfig } from './config'
import { FilterMenu } from './FilterMenu'
import { SortButton } from './SortButton'

type PoolFilterProps = {
  pools?: PoolCardProps[]
}

export function PoolFilter({ pools }: PoolFilterProps) {
  const [assetClasses, poolStatuses] = React.useMemo(() => {
    if (!pools) {
      return [[], []]
    }

    return [
      [...new Set(pools.map(({ assetClass }) => assetClass))],
      [...new Set(pools.map(({ status }) => status))],
    ] as [string[], string[]]
  }, [pools])

  return (
    <Grid gridTemplateColumns={COLUMNS} gap={COLUMN_GAPS} alignItems="start">
      <Text>Pool name</Text>

      <FilterMenu {...poolFilterConfig.assetClass} options={assetClasses} />

      <SortButton {...poolFilterConfig.valueLocked} />

      <SortButton {...poolFilterConfig.apr} />

      <FilterMenu {...poolFilterConfig.poolStatus} options={poolStatuses} />
    </Grid>
  )
}
