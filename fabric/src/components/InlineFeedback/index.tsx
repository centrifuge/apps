import * as React from 'react'
import styled from 'styled-components'
import { IconAlertCircle, IconCheckInCircle, IconInfo, IconInfoFailed } from '../../icon'
import { Flex } from '../Flex'
import { Shelf } from '../Shelf'
import { Text } from '../Text'

type Props = {
  status?: 'default' | 'info' | 'ok' | 'warning' | 'critical'
}

export type InlineFeedbackProps = React.PropsWithChildren<Props>

const icons = {
  default: IconInfo,
  info: IconInfo,
  ok: IconCheckInCircle,
  warning: IconAlertCircle,
  critical: IconInfoFailed,
}

export const InlineFeedback: React.FC<InlineFeedbackProps> = ({ status = 'default', children }) => {
  return (
    <Text variant="body3">
      <Shelf alignItems="baseline" gap="4px">
        <StyledIconWrapper minWidth="iconSmall" height="iconSmall" flex="0 0 auto">
          <StyledIcon as={icons[status]} size="iconSmall" />
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
