import { Box, Button, Dialog, IconInfo, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'

export const ExecutiveSummaryDialog: React.FC<{
  href: string
  open: boolean
  onClose: () => void
}> = ({ href, open, onClose }) => {
  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      width="684px"
      title="Confirmation required"
      icon={<IconInfo height="24" width="24" />}
    >
      <Stack gap="3">
        <Stack>
          <Text variant="body1">
            By clicking the button below, you confirm that you are requesting the executive summary without having been
            solicited or approached, directly or indirectly by the issuer of New Silver 2 or any affiliate.
          </Text>
        </Stack>
        <Box alignSelf="flex-end">
          <UnstyledLink href={href} download onClick={onClose} target="_blank">
            <Button variant="primary">View executive summary</Button>
          </UnstyledLink>
        </Box>
      </Stack>
    </Dialog>
  )
}

const UnstyledLink = styled.a`
  color: inherit;
  text-decoration: none;
`
