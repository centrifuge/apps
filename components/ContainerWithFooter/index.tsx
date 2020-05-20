import React, { PropsWithChildren } from 'react';
import { Box } from 'grommet';
import Footer from '../Footer';
class ContainerWithFooter extends React.Component<PropsWithChildren<{}>> {
  render() {
    return <>
      <Box align="center" pad={{ horizontal: 'small' }} style={{ minHeight: 'calc(100vh - 150px)' }}>
        {this.props.children}
      </Box>
      <Footer />
    </>;
  }
}

export default ContainerWithFooter;
