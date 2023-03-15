import { Box, IconX, Shelf, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

type AlertBusinessVerificationProps = {
  onClose: () => void
}

const Close = styled(Box)`
  appearance: none;
  display: block;
  width: ${({ theme }) => theme.sizes.iconSmall}px;
  height: ${({ theme }) => theme.sizes.iconSmall}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.tooltip}px;
  background-color: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
  }
`

const Anchor = styled(Text)`
  border-radius: ${({ theme }) => theme.radii.tooltip}px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: ${({ theme }) => `1px solid ${theme.colors.accentPrimary}`};
  }
`

export function AlertBusinessVerification({ onClose }: AlertBusinessVerificationProps) {
  return (
    <Shelf gap={1} p={2} borderRadius="input" backgroundColor="secondarySelectedBackground">
      <Close as="button" onClick={() => onClose()}>
        <IconX color="textPrimary" size="iconSmall" />
      </Close>

      <Text forwardedAs="strong" variant="body2">
        Unable to verify business information. Please contact{' '}
        <Anchor forwardedAs="a" href="mailto:support@centrifuge.io">
          support@centrifuge.io
        </Anchor>
        .
      </Text>
    </Shelf>
  )
}
