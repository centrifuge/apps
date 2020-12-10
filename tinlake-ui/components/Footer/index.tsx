import { Modal } from '@centrifuge/axis-modal'
import { Anchor, Box, Button, Paragraph } from 'grommet'
import { StatusInfo as StatusInfoIcon } from 'grommet-icons'
import React from 'react'

const Footer: React.FC<{}> = () => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Box
      background="rgb(249, 249, 249)"
      style={{ height: '120px' }}
      border={{
        color: '#f5f5f5',
        size: 'xsmall',
        style: 'solid',
        side: 'top',
      }}
      direction="column"
      justify="end"
    >
      <Box direction="row" margin={{ bottom: 'large', top: 'large' }} justify="center" pad={{ horizontal: 'small' }}>
        <Box direction="row" gap="large">
          <Anchor
            margin={{ top: 'xsmall' }}
            onClick={openModal}
            style={{ textDecoration: 'none', color: '#999' }}
            label="Investment Disclaimer"
          />
          <Anchor
            margin={{ top: 'xsmall' }}
            href="https://centrifuge.io/data-privacy-policy/"
            target="_blank"
            style={{ textDecoration: 'none', color: '#999' }}
            label="Data Privacy Policy"
          />
          <Anchor
            margin={{ top: 'xsmall' }}
            href="https://centrifuge.io/imprint"
            target="_blank"
            style={{ textDecoration: 'none', color: '#999' }}
            label="Imprint"
          />
        </Box>
      </Box>

      <Modal opened={modalIsOpen} title={'Investment Disclaimer'} titleIcon={<StatusInfoIcon />} onClose={closeModal}>
        <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
          Nothing contained in this website is to be construed as a solicitation or offer, or recommendation, to buy or
          sell any interest in any note or other security, or to engage in any other transaction, and the content herein
          does not constitute, and should not be considered to constitute, an offer of securities. No statement herein
          made constitutes an offer to sell or a solicitation of an offer to buy a note or other security.
        </Paragraph>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={closeModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default Footer
