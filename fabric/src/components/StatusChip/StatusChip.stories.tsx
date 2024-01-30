import { Meta } from '@storybook/react'
import * as React from 'react'
import { StatusChip } from '.'
import { Shelf } from '../Shelf'

export default {
  title: 'Components/StatusChip',
  component: StatusChip,
} as Meta<typeof StatusChip>

export const Default = () => (
  <Shelf gap={3}>
    {(['default', 'info', 'ok', 'warning', 'critical'] as const).map((status) => (
      <React.Fragment key={status}>
        <StatusChip status={status}>{status}</StatusChip>
      </React.Fragment>
    ))}
  </Shelf>
)
