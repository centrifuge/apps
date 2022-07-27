import { Modal } from '@centrifuge/axis-modal'
import { Box, Button, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import React from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const InvestmentDisclaimer: React.FC<Props> = (props: Props) => {
  return (
    <Modal opened={props.isOpen} title={'Investment Disclaimer'} titleIcon={<StatusInfoIcon />} onClose={props.onClose}>
      <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
        Nothing contained in this website is to be construed as a solicitation or offer, or recommendation, to buy or
        sell any interest in any note or other security, or to engage in any other transaction, and the content herein
        does not constitute, and should not be considered to constitute, an offer of securities. No statement herein
        made constitutes an offer to sell or a solicitation of an offer to buy a note or other security. All information
        on this Web page is provided and maintained by the issuers of the respective Tinlake pools. The issuers have
        full responsibility. Please contact the respective issuer in case of any inquiries. Centrifuge and its
        affiliates are not liable nor responsible for the information provided hereby.
      </Paragraph>
      <Paragraph margin={{ top: '0', bottom: 'medium' }}>
        Before investing in any of the Tinlake pools, please check the issuer's offering materials and subscription
        documents including the Executive Summary to understand the terms, conditions, and investment risks of each
        pool. The issuer provides investment risk factors which are important to understand when you consider whether to
        invest in a pool. You alone assume the sole responsibility of evaluating the merits and risks associated with
        the use of any information or other content before making any decisions based on such information or other
        content.
      </Paragraph>
      <Paragraph margin={{ top: '0', bottom: 'medium' }}>
        The Tinlake protocol is rewarding every Tinlake investment daily in CFG token, the Centrifuge Chain's native
        token. Note that these are rewards from the protocol for providing liquidity to the ecosystem independent from
        the pool, it's issuers, their asset originators, or any Centrifuge entity. There is no guarantee that an
        investor will receive those rewards.
      </Paragraph>

      <Box direction="row" justify="end">
        <Box basis={'1/5'}>
          <Button primary onClick={props.onClose} label="OK" fill={true} />
        </Box>
      </Box>
    </Modal>
  )
}

export default InvestmentDisclaimer
