import { StatusChip, StatusChipProps } from '@centrifuge/fabric'

export type PoolStatusKey = 'Open for investments' | 'Closed' | 'Upcoming' | 'Archived'

const statusColor: { [key in PoolStatusKey]: StatusChipProps['status'] } = {
  'Open for investments': 'warning',
  Closed: 'default',
  Upcoming: 'default',
  Archived: 'default',
}

export function PoolStatus({ status }: { status?: PoolStatusKey }) {
  return status ? <StatusChip status={statusColor[status] ?? 'default'}>{status}</StatusChip> : null
}
