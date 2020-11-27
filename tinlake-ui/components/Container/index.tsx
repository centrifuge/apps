import { Box } from 'grommet'
import React, { PropsWithChildren } from 'react'

class Container extends React.Component<PropsWithChildren<{}>> {
  render() {
    return (
      <Box align="center" pad={{ horizontal: 'small' }}>
        {this.props.children}
      </Box>
    )
  }
}

export default Container
