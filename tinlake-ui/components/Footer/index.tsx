import { Anchor, Box } from 'grommet'
import React from 'react'
import HelpMenu from '../HelpMenu'
import InvestmentDisclaimer from './InvestmentDisclaimer'

interface Props {
  hideHelpMenu?: boolean
}

const Footer: React.FC<Props> = (props: Props) => {
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = () => {
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Box background="rgb(249, 249, 249)" style={{ height: '120px' }} direction="column" justify="end">
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

      <InvestmentDisclaimer isOpen={modalIsOpen} onClose={closeModal} />

      {!props.hideHelpMenu && <HelpMenu />}
    </Box>
  )
}

export default Footer
