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

const statusIcons = {
  info: IconInfo,
  pending: StyledSpinner,
  ok: IconCheckCircle,
  warning: IconAlertCircle,
  critical: IconInfoFailed,
}

const statusColors = {
  info: 'infoPrimary',
  pending: 'infoPrimary',
  ok: 'okPrimary',
  warning: 'warningPrimary',
  critical: 'criticalPrimary',
}

export const Toast: React.FC<ToastProps> = ({ status = 'info', label, sublabel, onDismiss, action }) => {
  const Icon = statusIcons[status]
  return (
    <Card variant="overlay">
      <Shelf gap={2} px={2} py={1}>
        <Box minWidth="iconMedium" display="flex">
          <Icon size="iconMedium" color={statusColors[status]} />
        </Box>
        <Stack alignItems="flex-start">
          <Text variant="heading4">{label}</Text>
          <Text variant="label2">{sublabel}</Text>
        </Stack>
        <Shelf gap={2} ml="auto">
          {action}
          {onDismiss && <Button variant="text" icon={IconX} onClick={onDismiss} />}
        </Shelf>
      </Shelf>
    </Card>
  )
}
