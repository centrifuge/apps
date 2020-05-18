import React from 'react';
import { Box, Text, Anchor } from 'grommet';

interface FooterProps {
}

class Footer extends React.Component<FooterProps> {

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
      <Box basis={'1/5'}>
        <Text> Learn More </Text>
        <Anchor  margin={{ top: 'xsmall' }} href="https://centrifuge.io/products/tinlake/" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Website" />
        <Anchor  margin={{ top: 'xsmall' }} href="https://developer.centrifuge.io/" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="Documentation" />
        <Anchor  margin={{ top: 'xsmall' }} href="https://github.com/centrifuge" target="_blank" style={{ textDecoration: 'none', color: '#2762FF' }} label="GitHub" />
      </Box>
      </Box>
    </Box>;
  }
}

export default Footer;
