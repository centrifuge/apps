import { StatusChip, StatusChipProps } from '@centrifuge/fabric'
import * as React from 'react'

export type PoolStatusKey = 'Maker Pool' | 'Open for investments' | 'Closed'

const statusColor: { [key in PoolStatusKey]: StatusChipProps['status'] } = {
  'Maker Pool': 'ok',
  'Open for investments': 'info',
  Closed: 'default',
}

export function PoolStatus({ status }: { status?: PoolStatusKey }) {
  return status ? <StatusChip status={statusColor[status] ?? 'default'}>{status}</StatusChip> : null
}
