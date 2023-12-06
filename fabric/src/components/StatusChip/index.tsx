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

const Chip = styled(Text)<{ $borderColor: string; $bg: string }>((props) =>
  css({
    display: 'inline-block',
    px: 1,
    borderColor: props.$borderColor,
    bg: props.$bg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
  })
)

export const StatusChip: React.FC<StatusChipProps> = ({ status, children }) => {
  const colorName = colors[status]
  const bgColorName = `${colorName}Bg`

  return (
    <Chip
      forwardedAs="span"
      variant="label1"
      lineHeight="24px"
      color={colorName}
      $borderColor={colorName}
      $bg={bgColorName}
    >
      {children}
    </Chip>
  )
}
