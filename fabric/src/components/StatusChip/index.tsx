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

const Wrapper = styled.span<{ $color: string }>((props) =>
  css({
    display: 'inline-block',
    padding: '0 8px',
    borderColor: props.$color,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  })
)

export const StatusChip: React.FC<StatusChipProps> = ({ status, children }) => {
  const color = colors[status]
  return (
    <Wrapper $color={color}>
      <Text variant="label2" lineHeight="20px" color={color}>
        {children}
      </Text>
    </Wrapper>
  )
}
