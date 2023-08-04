import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

const Title = styled(Text)`
  display: block;
`

const Root = styled(Box)`
  filter: ${({ theme }) => `drop-shadow(${theme.shadows.cardInteractive})`};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    border: 5px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.backgroundPrimary};
    border-right-color: ${({ theme }) => theme.colors.backgroundPrimary};

    transform: translateX(100%) translateY(-50%) rotate(-45deg);

    @media screen and (min-width: ${({ theme }) => theme.breakpoints.L}) {
      border-top-color: ${({ theme }) => theme.colors.backgroundPrimary};
      border-left-color: ${({ theme }) => theme.colors.backgroundPrimary};
      border-right-color: transparent;

      transform: translateX(-50%) translateY(100%) rotate(-45deg);
    }
  }
`

export function ValidEmailTooltip() {
  return (
    <Root
      as="strong"
      position={['relative', 'relative', 'relative', 'absolute']}
      top={['auto', 'auto', 'auto', 0]}
      left={['auto', 'auto', 'auto', 'calc(100% + 15px)']}
      display="block"
      width={['100%', '100%', '100%', 225]}
      mt={[1, 1, 1, 0]}
      p={1}
      backgroundColor="backgroundPrimary"
      borderRadius="tooltip"
    >
      <Title forwardedAs="span" variant="heading6" color="statusInfo">
        Please enter a valid email
      </Title>
      <Text as="span" variant="body3">
        Your email will be verified. Please make sure you have access to confirm.
      </Text>
    </Root>
  )
}
