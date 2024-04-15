import { Grid, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { COLUMNS, COLUMN_GAPS, PoolCardProps } from '../PoolCard'
import { PoolStatusKey } from '../PoolCard/PoolStatus'
import { FilterMenu } from './FilterMenu'
import { SortButton } from './SortButton'
import { poolFilterConfig } from './config'

type PoolFilterProps = {
  pools?: PoolCardProps[]
}

const defaultPoolStatus: PoolStatusKey[] = ['Open for investments', 'Upcoming', 'Maker Pool', 'Closed']

export function PoolFilter({ pools }: PoolFilterProps) {
  const isMedium = useIsAboveBreakpoint('M')
  const [assetClasses, poolStatuses] = React.useMemo(() => {
    if (!pools) {
      return [[], []]
    }

    return [
      [...new Set(pools.map(({ assetClass }) => assetClass).filter(Boolean))].filter((s) => s !== 'Archived'),
      defaultPoolStatus,
    ] as [string[], PoolStatusKey[]]
  }, [pools])

  return (
    <Grid
      gridTemplateColumns={['minmax(100px, 1fr) 1fr', 'minmax(100px, 1fr) 1fr', ...COLUMNS]}
      gap={[...[3, 6], ...[3, 6], ...COLUMN_GAPS]}
      alignItems="start"
      minWidth={isMedium ? 970 : 0}
      px={2}
    >
      <Text as="span" variant="body3">
        Pool name
      </Text>

      {isMedium && (
        <FilterMenu
          {...poolFilterConfig.assetClass}
          options={assetClasses}
          tooltip="Different asset classes to group real-world assets with similar characteristics."
        />
      )}

      <SortButton
        {...poolFilterConfig.valueLocked}
        tooltip="Value locked represents the current total value of pool tokens."
      />

      {isMedium && <SortButton {...poolFilterConfig.apr} justifySelf="start" />}

      {isMedium && (
        <FilterMenu
          {...poolFilterConfig.poolStatus}
          options={poolStatuses}
          tooltip="Pool status displays the type of pool, if open or closed for investment and if senior tranche is funded by Maker."
        />
      )}
    </Grid>
  )
}
