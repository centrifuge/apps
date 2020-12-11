import { Box } from 'grommet'
import React, { PropsWithChildren } from 'react'

class Container extends React.Component<PropsWithChildren<{ [k: string]: any }>> {
  render() {
    const { children, ...rest } = this.props

    return (
      <Box align="center" pad={{ horizontal: 'small' }} {...rest} style={{ background: 'rgb(249, 249, 249)' }}>
        {this.props.children}
      </Box>
    )
  }
}

export default Container
