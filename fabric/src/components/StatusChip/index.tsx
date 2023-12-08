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

const Chip = styled(Text)((props) =>
  css({
    px: 1,
    bg: `${props.color}Bg`,
    borderRadius: 'chip',
    whiteSpace: 'nowrap',
  })
)

export function StatusChip({ status, children }: StatusChipProps) {
  const color = colors[status]

  return (
    <Chip forwardedAs="span" variant="label2" lineHeight="20px" color={color}>
      {children}
    </Chip>
  )
}
