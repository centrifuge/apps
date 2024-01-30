import { StatusChip, StatusChipProps } from '@centrifuge/fabric'
import * as React from 'react'

export type PoolStatusKey = 'Maker Pool' | 'Open for investments' | 'Closed' | 'Upcoming' | 'Archived'

const statusColor: { [key in PoolStatusKey]: StatusChipProps['status'] } = {
  'Maker Pool': 'info',
  'Open for investments': 'ok',
  Closed: 'default',
  Upcoming: 'default',
  Archived: 'default',
}

export function PoolStatus({ status }: { status?: PoolStatusKey }) {
  return status ? <StatusChip status={statusColor[status] ?? 'default'}>{status}</StatusChip> : null
}
