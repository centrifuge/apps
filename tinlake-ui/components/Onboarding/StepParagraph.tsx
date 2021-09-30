import * as React from 'react'
import styled from 'styled-components'
import { Flex, Shelf } from '../Layout'
import { Text } from '../Text'
import { AlertIcon } from './AlertIcon'
import { ClockIcon } from './ClockIcon'
import { PlainCheckIcon } from './PlainCheckIcon'

interface Props {
  icon?: 'alert' | 'clock' | 'check'
}

export const StepParagraph: React.FC<Props> = ({ icon, children }) => {
  return (
    <Shelf as={Text} gap="xsmall" alignItems="baseline">
      {icon && (
        <FirstLineAlignedIcon minWidth="24px" flex="0 0 24px">
          {icon === 'alert' ? <AlertIcon /> : icon === 'check' ? <PlainCheckIcon /> : <ClockIcon />}
        </FirstLineAlignedIcon>
      )}
      <Text>{children}</Text>
    </Shelf>
  )
}

const FirstLineAlignedIcon = styled(Flex)`
  > * {
    align-self: center;
    margin: -20px 0;
  }

  &::before {
    content: '.';
    width: 0;
    visibility: hidden;
  }
`
