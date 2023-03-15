import { Box, Grid, IconAlertCircle, IconCheckCircle, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type NotificationProps = {
  children: React.ReactNode
  type?: 'alert' | 'success'
}

const Root = styled(Grid)`
  box-shadow: ${({ theme }) => theme.shadows.cardOverlay};
`

const Body = styled(Text)`
  a,
  button {
    font-weight: inherit;
    font-size: inherit;
    font-family: inherit;
    color: ${({ theme }) => theme.colors.accentPrimary};

    &:hover {
      text-decoration: underline;
    }
  }

  button {
    appearance: none;
    background-color: transparent;
    border: 0;
    cursor: pointer;

    &:focus-visible {
      outline: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
    }
  }
`

export function Notification({ children, type = 'success' }: NotificationProps) {
  return (
    <Root
      gridTemplateColumns="auto 1fr"
      gap={1}
      maxWidth="max-content"
      p={2}
      pr={4}
      borderRadius="input"
      backgroundColor="backgroundPrimary"
    >
      <Box mt="1px">
        {type === 'success' && <IconCheckCircle size="iconSmall" color="statusOk" />}
        {type === 'alert' && <IconAlertCircle size="iconSmall" color="statusWarning" />}
      </Box>

      <Body forwardedAs="strong" variant="body2">
        {children}
      </Body>
    </Root>
  )
}
