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
    <Grid gridTemplateColumns={COLUMNS} gap={COLUMN_GAPS} alignItems="start" minWidth={970} px={2}>
      <Text as="span" variant="body3">
        Pool name
      </Text>

      <FilterMenu
        {...poolFilterConfig.assetClass}
        options={assetClasses}
        tooltip="Different asset classes to group real-world assets with similar characteristics."
      />

      <SortButton
        {...poolFilterConfig.valueLocked}
        tooltip="Value locked represents the current total value of pool tokens."
      />

      <SortButton {...poolFilterConfig.apr} />

      <FilterMenu
        {...poolFilterConfig.poolStatus}
        options={poolStatuses}
        tooltip="Pool status displays the type of pool, if open or closed for investment and if senior tranche is funded by Maker."
      />
    </Grid>
  )
}
