import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'
import { Text } from '../Text'

export type StatusChipProps = React.PropsWithChildren<{
  status: 'default' | 'info' | 'ok' | 'warning' | 'critical'
}>

const backgroundColor = {
  default: 'statusDefault',
  info: 'statusDefault',
  ok: 'statusOk',
  warning: 'statusWarning',
  critical: 'statusCritical',
}

const textColor = {
  default: 'statusDefault',
  info: 'statusInfo',
  ok: 'statusOk',
  warning: 'statusWarning',
  critical: 'statusCritical',
}

const Chip = styled(Text)((props) =>
  css({
    display: 'inline-block',
    px: 1,
    bg: `${props.backgroundColor}Bg`,
    borderRadius: 'chip',
    whiteSpace: 'nowrap',
    color: `${props.color}`,
  })
)

export function StatusChip({ status, children }: StatusChipProps) {
  return (
    <Chip forwardedAs="span" variant="label2" lineHeight="20px" backgroundColor={backgroundColor[status]}>
      <Text fontWeight={500} variant="label2" color={textColor[status]}>
        {children}
      </Text>
    </Chip>
  )
}
