import React from 'react';
import { Box, Button, Text, Anchor, Paragraph } from 'grommet';
import { StatusInfo as StatusInfoIcon } from 'grommet-icons';
import { Modal } from '@centrifuge/axis-modal';

interface Props {
}

interface State {
  modalIsOpen: boolean;
}

class Footer extends React.Component<Props, State> {

  state: State = {
    modalIsOpen: false
  };

  openModal = () => { this.setState({ modalIsOpen: true }); };
  closeModal = () => { this.setState({ modalIsOpen: false }); };

  render() {
    return <Box
        style={{ height:'150px' }}
        border={{
          color: '#f5f5f5',
          size: 'xsmall',
          style: 'solid',
          side: 'top'
        }}
        justify="center"
        direction="row"
        >

      <Box direction="row" width="xlarge" justify="between" margin={{ top:'medium', bottom:'medium' }} pad={{ horizontal:'small' }}>
        <Box basis={'1/5'}>
          <Text> Centrifuge Tinlake </Text>
        </Box>
        <Box basis={'1/5'} direction="row" gap={'80px'}>
          <Box>
            <Text> Learn More </Text>
            <Anchor  margin={{ top: 'xsmall' }} href="https://centrifuge.io/products/tinlake/" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Website" />
            <Anchor  margin={{ top: 'xsmall' }} href="https://developer.centrifuge.io/" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Documentation" />
            <Anchor  margin={{ top: 'xsmall' }} href="https://github.com/centrifuge" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="GitHub" />
          </Box>
          <Box>
            <Text>&nbsp;</Text>
            <Anchor  margin={{ top: 'xsmall' }} onClick={this.openModal} style={{ textDecoration: 'none', color: '#2762FF' }} label="Investment Disclaimer" />
            <Anchor  margin={{ top: 'xsmall' }} href="https://centrifuge.io/data-privacy-policy/" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Data Privacy Policy" />
            <Anchor  margin={{ top: 'xsmall' }} href="https://centrifuge.io/imprint" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Imprint" />
          </Box>
        </Box>
      </Box>

      <Modal
        opened={this.state.modalIsOpen}
        title={'Investment Disclaimer'}
        titleIcon={<StatusInfoIcon />}
        onClose={this.closeModal}
      >
        <Paragraph margin={{ top: 'medium', bottom: 'medium' }}>
          Nothing contained in this website is to be construed as a solicitation or offer, or recommendation, to buy or sell any interest in any note or other security, or to engage in any other transaction, and the content herein does not constitute, and should not be considered to constitute, an offer of securities. No statement herein made constitutes an offer to sell or a solicitation of an offer to buy a note or other security.
        </Paragraph>

        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <Button primary onClick={this.closeModal} label="OK" fill={true} />
          </Box>
        </Box>
      </Modal>
    </Box>;
  }
}

export default Footer;
