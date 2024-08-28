import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { InvestmentDisclaimerDialog } from './Dialogs/InvestmentDisclaimerDialog'

export const Footer = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  return (
    <>
      <InvestmentDisclaimerDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      <Stack as="footer" gap={1} width="100%">
        <UnstyledLink href="mailto:support@centrifuge.io">
          <Text textOverflow="ellipsis" variant="body4" color="textInverted">
            Need help?
          </Text>
        </UnstyledLink>
        <UnstyledLink href="https://docs.centrifuge.io/">
          <Text textOverflow="ellipsis" variant="body4" color="textInverted">
            Documentation
          </Text>
        </UnstyledLink>
        <UntyledButton onClick={() => setIsDialogOpen(true)}>
          <Text textOverflow="ellipsis" variant="body4" color="textInverted">
            Investment disclaimer
          </Text>
        </UntyledButton>
        <UnstyledLink target="_blank" href="https://centrifuge.io/data-privacy-policy/">
          <Text textOverflow="ellipsis" variant="body4" color="textInverted">
            Data privacy policy
          </Text>
        </UnstyledLink>
        <UnstyledLink target="_blank" href="https://centrifuge.io/imprint/">
          <Text textOverflow="ellipsis" variant="body4" color="textInverted">
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
