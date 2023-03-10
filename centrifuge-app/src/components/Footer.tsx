import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { InvestmentDisclaimerDialog } from './Dialogs/InvestmentDisclaimerDialog'

export const Footer = () => {
  const theme = useTheme()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  return (
    <>
      <InvestmentDisclaimerDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      <Stack as="footer" px={2} py="12px" gap={1} width="100%" background={theme.colors.backgroundPrimary}>
        <UntyledButton onClick={() => setIsDialogOpen(true)}>
          <Text textOverflow="ellipsis" variant="body4">
            Investment disclaimer
          </Text>
        </UntyledButton>
        <UnstyledLink target="_blank" href="https://centrifuge.io/data-privacy-policy/">
          <Text textOverflow="ellipsis" variant="body4">
            Data privacy policy
          </Text>
        </UnstyledLink>
        <UnstyledLink target="_blank" href="https://centrifuge.io/imprint/">
          <Text textOverflow="ellipsis" variant="body4">
            Imprint
          </Text>
        </UnstyledLink>
      </Stack>
    </>
  )
}

const UntyledButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
`

const UnstyledLink = styled.a`
  background: transparent;
  cursor: pointer;
`
