import { Box, Button, Dialog, IconInfo, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

export const ExecutiveSummaryDialog: React.FC<{
  href: string
  open: boolean
  onClose: () => void
}> = ({ href, open, onClose }) => {
  return (
    <Dialog isOpen={open} onClose={onClose} width="684px">
      <Box display="flex">
        <Box mr="3">
          <IconInfo height="24" width="24" />
        </Box>
        <Stack gap="3">
          <Text variant="heading2">Confirmation required</Text>
          <Stack>
            <Text variant="body1">
              By clicking the button below, you confirm that you are requesting the executive summary without having
              been solicited or approached, directly or indirectly by the issuer of New Silver 2 or any affiliate.
            </Text>
          </Stack>
          <Box alignSelf="flex-end">
            <UnstyledLink href={href} download onClick={onClose} target="_blank">
              <Button variant="secondary">View executive summary</Button>
            </UnstyledLink>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  )
}

const UnstyledLink = styled.a`
  color: inherit;
  underline: none;
`
