import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import IconAlertCircle from '../../icon/IconAlertCircle'
import IconCheckCircle from '../../icon/IconCheckCircle'
import IconInfo from '../../icon/IconInfo'
import IconInfoFailed from '../../icon/IconInfoFailed'
import IconSpinner from '../../icon/IconSpinner'
import IconX from '../../icon/IconX'
import { Box } from '../Box'
import { Button } from '../Button'
import { Card } from '../Card'
import { Shelf } from '../Shelf'
import { Stack } from '../Stack'
import { Text } from '../Text'

export type ToastStatus = 'info' | 'pending' | 'ok' | 'warning' | 'critical'

export type ToastProps = {
  status: ToastStatus
  label: string
  sublabel?: string
  onDismiss?: () => void
  onStatusChange?: (status: ToastStatus) => void
  action?: React.ReactElement
}

const rotate = keyframes`
	0% {
		transform: rotate(0);
	}

	100% {
		transform: rotate(1turn);
	}
`

const StyledSpinner = styled(IconSpinner)`
  animation: ${rotate} 0.8s linear infinite;
`

const StyledSublabel = styled(Text)`
  word-break: normal;
  overflow-wrap: anywhere;
`

const statusIcons = {
  info: IconInfo,
  pending: StyledSpinner,
  ok: IconCheckCircle,
  warning: IconAlertCircle,
  critical: IconInfoFailed,
}

const statusColors = {
  info: 'statusInfo',
  pending: 'statusInfo',
  ok: 'statusOk',
  warning: 'statusWarning',
  critical: 'statusCritical',
}

export function Toast({ status = 'info', label, sublabel, onDismiss, onStatusChange, action }: ToastProps) {
  const Icon = statusIcons[status]
  React.useEffect(() => {
    onStatusChange && onStatusChange(status)
  }, [status, onStatusChange])
  return (
    <Card variant="overlay" backgroundColor={`${statusColors[status]}Bg`}>
      <Shelf gap={2} px={2} py={1}>
        <Box minWidth="iconMedium" display="flex">
          <Icon size="iconMedium" color={statusColors[status]} />
        </Box>
        <Stack alignItems="flex-start">
          <Text variant="heading4" color={statusColors[status]} style={{ fontWeight: 700 }}>
            {label}
          </Text>
          <StyledSublabel variant="body3" color={statusColors[status]}>
            {sublabel}
          </StyledSublabel>
        </Stack>
        <Shelf ml="auto">
          {action}
          {onDismiss && <Button variant="tertiary" icon={<IconX color={statusColors[status]} />} onClick={onDismiss} />}
        </Shelf>
      </Shelf>
    </Card>
  )
}
