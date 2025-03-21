import { Box, Button, Dialog, IconInfo, Stack, Text } from '@centrifuge/fabric'
import styled from 'styled-components'

export function ExecutiveSummaryDialog({
  issuerName,
  href,
  open,
  onClose,
}: {
  issuerName: string
  href: string
  open: boolean
  onClose: () => void
}) {
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
            solicited or approached, directly or indirectly by the issuer of {issuerName} or any affiliate.
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
