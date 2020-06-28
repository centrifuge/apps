import React, { PropsWithChildren } from 'react';
import { Box } from 'grommet';

class Container extends React.Component<PropsWithChildren<{}>> {
  render() {
    return <Box align="center" pad={{ horizontal: 'small' }}>
        {this.props.children}
      </Box>;
  }
}

export default Container;
