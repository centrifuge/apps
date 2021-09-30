import { Box } from 'grommet'
import React, { PropsWithChildren } from 'react'
import { ClientOnlyRender } from '../ClientOnlyRender'

class Container extends React.Component<PropsWithChildren<{ [k: string]: any }>> {
  render() {
    const { children, ...rest } = this.props

    return (
      <Box align="center" pad={{ horizontal: 'medium' }} {...rest} style={{ background: 'rgb(249, 249, 249)' }}>
        <ClientOnlyRender>{this.props.children}</ClientOnlyRender>
      </Box>
    )
  }
}

export default Container
