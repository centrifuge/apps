import * as React from 'react'
import styled from 'styled-components'
import { IconAlertCircle, IconCheckInCircle, IconInfo, IconInfoFailed } from '../../icon'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

type OwnProps = {
  status?: 'default' | 'info' | 'ok' | 'warning' | 'critical'
}

export type InlineFeedbackProps = React.PropsWithChildren<OwnProps>

const icons = {
  default: IconInfo,
  info: IconInfo,
  ok: IconCheckInCircle,
  warning: IconAlertCircle,
  critical: IconInfoFailed,
}

const capitalizeFirstLetter = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

export function InlineFeedback({ status = 'default', children }: InlineFeedbackProps) {
  return (
    <Text variant="body3">
      <Shelf alignItems="baseline" gap="4px">
        <StyledIconWrapper minWidth="iconSmall" height="iconSmall" flex="0 0 auto">
          <StyledIcon as={icons[status]} size="iconSmall" color={`status${capitalizeFirstLetter(status)}`} />
        </StyledIconWrapper>
        <Text>{children}</Text>
      </Shelf>
    </Text>
  )
}

const StyledIconWrapper = styled(Flex)`
  &::before {
    content: '.';
    width: 0;
    align-self: center;
    visibility: hidden;
  }
`

const StyledIcon = styled.div`
  align-self: center;
`
