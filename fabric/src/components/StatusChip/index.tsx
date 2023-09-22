import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { Text } from '../Text'

export type StatusChipProps = React.PropsWithChildren<{
  status: 'default' | 'info' | 'ok' | 'warning' | 'critical'
}>

const colors = {
  default: 'statusDefault',
  info: 'statusInfo',
  ok: 'statusOk',
  warning: 'statusWarning',
  critical: 'statusCritical',
}

const Chip = styled(Text)<{ $borderColor: string }>((props) =>
  css({
    display: 'inline-block',
    padding: '0 8px',
    borderColor: props.$borderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  })
)

export const StatusChip: React.FC<StatusChipProps> = ({ status, children }) => {
  const color = colors[status]

  return (
    <Chip forwardedAs="span" variant="label2" lineHeight="20px" color={color} $borderColor={color}>
      {children}
    </Chip>
  )
}
