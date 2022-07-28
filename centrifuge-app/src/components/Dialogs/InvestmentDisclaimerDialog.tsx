import { Box, Button, Dialog, IconInfo, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'

export const InvestmentDisclaimerDialog: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  return (
    <Dialog
      title="Investment disclaimer"
      icon={<IconInfo height="24" width="24" />}
      isOpen={open}
      onClose={onClose}
      width="684px"
    >
      <Stack gap="3">
        <Box px="5">
          <Text variant="body1">
            Nothing contained in this website is to be construed as a solicitation or offer, or recommendation, to buy
            or sell any interest in any note or other security, or to engage in any other transaction, and the content
            herein does not constitute, and should not be considered to constitute, an offer of securities. No statement
            herein made constitutes an offer to sell or a solicitation of an offer to buy a note or other security. All
            information on this Web page is provided and maintained by the issuers of the respective pools. The issuers
            have full responsibility. Please contact the respective issuer in case of any inquiries. Centrifuge and its
            affiliates are not liable nor responsible for the information provided hereby.
            <br />
            <br />
            Before investing in any of the pools, please check the issuer's offering materials and subscription
            documents including the Executive Summary to understand the terms, conditions, and investment risks of each
            pool. The issuer provides investment risk factors which are important to understand when you consider
            whether to invest in a pool. You alone assume the sole responsibility of evaluating the merits and risks
            associated with the use of any information or other content before making any decisions based on such
            information or other content.
          </Text>
        </Box>
        <Box ml="auto">
          <Button variant="primary" onClick={onClose}>
            Ok
          </Button>
        </Box>
      </Stack>
    </Dialog>
  )
}
